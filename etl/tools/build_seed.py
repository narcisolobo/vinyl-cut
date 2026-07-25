import argparse
import csv
import json
import os
import re
import time
from io import StringIO
from pathlib import Path

import musicbrainzngs
import pandas as pd
import requests
from dotenv import load_dotenv
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

WIKI_URL = "https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Albums/500"
CAA_METADATA_URL = "https://coverartarchive.org/release/{mbid}"
DEFAULT_SCORE_THRESHOLD = 90
DEFAULT_MIN_SCORE_GAP = 5
CAA_REQUEST_INTERVAL = 1.0

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
ACCEPTED_PATH = SEED_DIR / "seed.json"
REVIEW_PATH = SEED_DIR / "needs_review.csv"
DISCARD_PATH = SEED_DIR / "discarded.csv"

_last_caa_call = 0.0


def user_agent_contact() -> str:
    contact = os.environ.get("MB_CONTACT")
    if not contact:
        raise SystemExit("MB_CONTACT env var is required (email or URL, per MusicBrainz/CAA API etiquette)")
    return contact


def configure_musicbrainz():
    musicbrainzngs.set_useragent("TheVinylCutSeedBuilder", "0.1", user_agent_contact())


def throttle_caa():
    global _last_caa_call
    elapsed = time.monotonic() - _last_caa_call
    if elapsed < CAA_REQUEST_INTERVAL:
        time.sleep(CAA_REQUEST_INTERVAL - elapsed)
    _last_caa_call = time.monotonic()


def resolve_column(columns, keywords):
    for col in columns:
        name = str(col).lower()
        if any(keyword in name for keyword in keywords):
            return col
    return None


def clean_text(value) -> str:
    text = str(value)
    text = re.sub(r"\[.*?\]", "", text)
    return text.strip()


def fetch_rs500() -> list[dict]:
    resp = requests.get(WIKI_URL, headers={"User-Agent": user_agent_contact()}, timeout=30)
    resp.raise_for_status()

    tables = pd.read_html(StringIO(resp.text), match="Album")
    table = max(tables, key=len)

    rank_col = resolve_column(table.columns, ["#", "no."])
    title_col = resolve_column(table.columns, ["album"])
    artist_col = resolve_column(table.columns, ["artist"])
    if title_col is None or artist_col is None:
        raise SystemExit(f"Could not identify Album/Artist columns in table; found columns: {list(table.columns)}")

    rows = []
    for i, row in table.iterrows():
        title = clean_text(row[title_col])
        artist = clean_text(row[artist_col])
        if not title or not artist:
            continue
        rank = clean_text(row[rank_col]) if rank_col is not None else str(i + 1)
        rows.append({"rank": rank, "title": title, "artist": artist})
    return rows


@retry(retry=retry_if_exception_type(Exception), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def search_release_groups(artist: str, title: str) -> list[dict]:
    result = musicbrainzngs.search_release_groups(artist=artist, releasegroup=title, limit=5)
    return result.get("release-group-list", [])


@retry(retry=retry_if_exception_type(Exception), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def browse_releases(release_group_id: str) -> list[dict]:
    result = musicbrainzngs.browse_releases(release_group=release_group_id, release_status=["official"], limit=25)
    return result.get("release-list", [])


@retry(retry=retry_if_exception_type(requests.exceptions.RequestException), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def has_front_art(release_mbid: str) -> bool:
    throttle_caa()
    # CAA's release-level metadata endpoint returns JSON describing available images
    # without downloading the image itself, so this existence check stays cheap.
    resp = requests.get(
        CAA_METADATA_URL.format(mbid=release_mbid),
        headers={"User-Agent": user_agent_contact()},
        timeout=15,
    )
    if resp.status_code == 404:
        return False
    resp.raise_for_status()
    images = resp.json().get("images", [])
    return any(image.get("front") for image in images)


def pick_release_with_art(release_group_id: str) -> dict | None:
    for release in browse_releases(release_group_id):
        if has_front_art(release["id"]):
            return release
    return None


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def find_release_among_candidates(candidates: list[dict]) -> list[tuple[dict, dict]]:
    hits = []
    for candidate in candidates:
        try:
            release = pick_release_with_art(candidate["id"])
        except Exception:
            release = None
        if release is not None:
            hits.append((candidate, release))
    return hits


def resolve_row(row: dict, score_threshold: int, min_score_gap: int) -> dict:
    try:
        candidates = search_release_groups(row["artist"], row["title"])
    except Exception as exc:
        return {**row, "status": "discarded", "reason": f"MusicBrainz search error: {exc}"}

    if not candidates:
        return {**row, "status": "discarded", "reason": "no release-group match"}

    ranked = sorted(candidates, key=lambda c: int(c.get("ext:score", 0)), reverse=True)
    best = ranked[0]
    score = int(best.get("ext:score", 0))
    runner_up_score = int(ranked[1].get("ext:score", 0)) if len(ranked) > 1 else 0
    is_clear_winner = score >= score_threshold and (score - runner_up_score) >= min_score_gap

    if is_clear_winner:
        try:
            release = pick_release_with_art(best["id"])
        except Exception:
            release = None
        if release is not None:
            return {**row, "status": "accepted", "mbid": release["id"], "release_group_id": best["id"], "match_score": score}

    # No single clear winner with art yet - sweep every fetched candidate for CAA art rather
    # than giving up on the top pick alone. A lot of "ties" turn out to be unmerged duplicate
    # release-groups for the exact same album, which CAA availability often resolves outright.
    hits = find_release_among_candidates(ranked)

    if not hits:
        return {
            **row,
            "status": "discarded",
            "reason": "no candidate release group has an official release with a Cover Art Archive front image",
        }

    if len(hits) == 1:
        candidate, release = hits[0]
        return {
            **row,
            "status": "accepted",
            "mbid": release["id"],
            "release_group_id": candidate["id"],
            "match_score": int(candidate.get("ext:score", 0)),
        }

    same_album = all(
        normalize(candidate.get("title", "")) == normalize(hits[0][0].get("title", ""))
        and normalize(candidate.get("artist-credit-phrase", "")) == normalize(hits[0][0].get("artist-credit-phrase", ""))
        for candidate, _ in hits
    )
    if same_album:
        candidate, release = min(hits, key=lambda hit: hit[1].get("date") or "9999")
        return {
            **row,
            "status": "accepted",
            "mbid": release["id"],
            "release_group_id": candidate["id"],
            "match_score": int(candidate.get("ext:score", 0)),
        }

    # Among surviving candidates, prefer one whose title AND artist are an exact match
    # over variants with extra qualifiers ("Live", ": Best", "(Remixes)", etc.) - title
    # alone isn't enough, since a same-titled cover/tribute by a different artist can
    # otherwise out-rank the real artist's own (differently-subtitled) release.
    exact_title_hits = [
        (candidate, release)
        for candidate, release in hits
        if normalize(candidate.get("title", "")) == normalize(row["title"])
        and normalize(candidate.get("artist-credit-phrase", "")) == normalize(row["artist"])
    ]
    if len(exact_title_hits) == 1:
        candidate, release = exact_title_hits[0]
        return {
            **row,
            "status": "accepted",
            "mbid": release["id"],
            "release_group_id": candidate["id"],
            "match_score": int(candidate.get("ext:score", 0)),
        }

    return {
        **row,
        "status": "needs_review",
        "candidates": [
            {
                "release_group_id": candidate["id"],
                "release_mbid": release["id"],
                "title": candidate.get("title"),
                "artist": candidate.get("artist-credit-phrase"),
                "score": candidate.get("ext:score"),
            }
            for candidate, release in hits
        ],
    }


def write_outputs(accepted: list[dict], review: list[dict], discarded: list[dict]):
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    with open(ACCEPTED_PATH, "w") as f:
        json.dump(
            [
                {"mbid": r["mbid"], "rank": r["rank"], "title": r["title"], "artist": r["artist"]}
                for r in accepted
            ],
            f,
            indent=2,
        )

    with open(REVIEW_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["rank", "title", "artist", "candidate_1", "score_1", "candidate_2", "score_2", "candidate_3", "score_3"])
        for r in review:
            flat = []
            for c in r["candidates"][:3]:
                flat += [f"{c['artist']} - {c['title']} (rg:{c['release_group_id']} rel:{c['release_mbid']})", c["score"]]
            while len(flat) < 6:
                flat += ["", ""]
            writer.writerow([r["rank"], r["title"], r["artist"], *flat])

    with open(DISCARD_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["rank", "title", "artist", "reason"])
        for r in discarded:
            writer.writerow([r["rank"], r["title"], r["artist"], r.get("reason", "")])


def main():
    parser = argparse.ArgumentParser(description="Build a MusicBrainz-MBID seed file from Rolling Stone's 500 list.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N rows (for a quick test run).")
    parser.add_argument("--score-threshold", type=int, default=DEFAULT_SCORE_THRESHOLD)
    parser.add_argument("--min-score-gap", type=int, default=DEFAULT_MIN_SCORE_GAP)
    args = parser.parse_args()

    load_dotenv()
    configure_musicbrainz()

    print(f"Fetching Rolling Stone 500 list from {WIKI_URL} ...")
    rows = fetch_rs500()
    if args.limit:
        rows = rows[: args.limit]
    print(f"{len(rows)} rows to resolve\n")

    accepted, review, discarded = [], [], []
    for i, row in enumerate(rows, start=1):
        result = resolve_row(row, args.score_threshold, args.min_score_gap)
        {"accepted": accepted, "needs_review": review, "discarded": discarded}[result["status"]].append(result)
        print(f"[{i}/{len(rows)}] #{row['rank']} {row['artist']} - {row['title']}: {result['status']}")

    write_outputs(accepted, review, discarded)

    print(f"\nAccepted:     {len(accepted)} -> {ACCEPTED_PATH}")
    print(f"Needs review: {len(review)} -> {REVIEW_PATH}")
    print(f"Discarded:    {len(discarded)} -> {DISCARD_PATH}")


if __name__ == "__main__":
    main()

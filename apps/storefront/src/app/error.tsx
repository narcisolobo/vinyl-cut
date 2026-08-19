"use client";

import Eyebrow from "@/components/Eyebrow";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <section
      id="home"
      className="vc-gradient min-h-dvh px-8 pt-36 pb-24 md:pb-28 lg:pt-56 lg:pb-32 2xl:px-0"
    >
      <div className="mx-auto max-w-5xl">
        <hgroup>
          <Eyebrow message="Needle slipped" />
          <h1 className="font-heading text-shadow-headline mb-6 text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
            We Hit a Bad Groove.
          </h1>
        </hgroup>
        <p className="mb-8 text-[clamp(1.05rem,1.4vw,1.3rem)] md:max-w-[35ch] lg:max-w-[50ch]">
          Something went wrong on our end — not yours. Give it another spin.{" "}
          {error.digest && (
            <span className="text-base-content/70 text-sm">{error.digest}</span>
          )}
        </p>
        <button
          className="btn btn-lg btn-accent uppercase"
          onClick={() => retry()}
        >
          Try Again
        </button>
        <Link
          href="/store"
          className="btn btn-lg btn-outline btn-accent ml-4 uppercase"
        >
          Browse the crates
        </Link>
      </div>
    </section>
  );
}

export default ErrorPage;

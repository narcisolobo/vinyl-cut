"use client";

import { subscribeToRestock } from "@/lib/data/restock-subscriptions";
import type { RestockSubscriptionState } from "@/lib/data/restock-subscription-schema";
import type { Album, AlbumVariant } from "@/types/album";
import { cn } from "@/lib/utils/cn";
import { useActionState, useRef } from "react";

type NotifyMeButtonProps = {
  album: Pick<Album, "title" | "artist">;
  variant: AlbumVariant;
};

const initialState: RestockSubscriptionState = {
  status: "idle",
  emailError: null,
  formError: null,
};

function NotifyMeButton({ album, variant }: NotifyMeButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    subscribeToRestock,
    initialState,
  );

  return (
    <>
      <button
        type="button"
        className="btn btn-accent btn-lg"
        onClick={() => dialogRef.current?.showModal()}
      >
        Notify Me
      </button>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="notify-me-title"
      >
        <div className="modal-box">
          {state.status === "success" ? (
            <>
              <h3 id="notify-me-title" className="text-lg font-bold">
                You&apos;re on the list
              </h3>
              <div role="alert" className="alert alert-success mt-4">
                <span>
                  We&apos;ll email you the moment {album.artist} —
                  &quot;{album.title}&quot; ({variant.condition}) is back in
                  stock.
                </span>
              </div>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn">Close</button>
                </form>
              </div>
            </>
          ) : (
            <>
              <h3 id="notify-me-title" className="text-lg font-bold">
                Notify Me
              </h3>
              <p className="py-2 text-sm">
                {album.artist} — &quot;{album.title}&quot; (
                {variant.condition}) is currently out of stock. Enter your
                email and we&apos;ll let you know as soon as it&apos;s back.
              </p>
              <form action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="variant_id" value={variant.id} />
                <label className="floating-label">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email"
                    className={cn(
                      "input w-full",
                      state.emailError && "input-error",
                    )}
                  />
                  <span>Email</span>
                </label>
                {state.emailError && (
                  <p className="text-error text-sm">{state.emailError}</p>
                )}
                {state.formError && (
                  <div role="alert" className="alert alert-error">
                    <span>{state.formError}</span>
                  </div>
                )}
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => dialogRef.current?.close()}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent"
                    disabled={pending}
                  >
                    {pending ? "Submitting…" : "Notify Me"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

export default NotifyMeButton;

/**
 * `<ViewTransition>` ships in React's canary channel, which Next.js's App
 * Router vendors internally (see `experimental.viewTransition` in
 * next.config.ts). The workspace's `@types/react` is pinned to 19.0.5 via
 * the root `pnpm-workspace.yaml` override and predates the `react/canary`
 * type entry point, so these types are declared by hand here instead.
 *
 * Mirrors `react/canary` from `@types/react@19.2.17`.
 * https://react.dev/reference/react/ViewTransition
 */
import type { ExoticComponent, ReactNode, Ref } from "react";

declare module "react" {
  export interface ViewTransitionInstance {
    name: string;
  }

  export type ViewTransitionClassPerType = Record<
    "default" | (string & {}),
    "none" | "auto" | (string & {})
  >;
  export type ViewTransitionClass =
    | ViewTransitionClassPerType
    | ViewTransitionClassPerType[string];

  export interface ViewTransitionProps {
    children?: ReactNode | undefined;
    default?: ViewTransitionClass | undefined;
    enter?: ViewTransitionClass | undefined;
    exit?: ViewTransitionClass | undefined;
    name?: "auto" | (string & {}) | undefined;
    onEnter?: (
      instance: ViewTransitionInstance,
      types: Array<string>,
    ) => void | (() => void);
    onExit?: (
      instance: ViewTransitionInstance,
      types: Array<string>,
    ) => void | (() => void);
    onShare?: (
      instance: ViewTransitionInstance,
      types: Array<string>,
    ) => void | (() => void);
    onUpdate?: (
      instance: ViewTransitionInstance,
      types: Array<string>,
    ) => void | (() => void);
    ref?: Ref<ViewTransitionInstance> | undefined;
    share?: ViewTransitionClass | undefined;
    update?: ViewTransitionClass | undefined;
  }

  export const ViewTransition: ExoticComponent<ViewTransitionProps>;
}

import { kvGet, kvSet } from "./store";

/**
 * Persistent launch state. Flipping it NEVER sends anything by itself —
 * it records that the product passed internal readiness, and (much later,
 * with every env gate open) that the public launch was begun.
 */

if (typeof window !== "undefined") {
  throw new Error("launch-state is server-side only");
}

const KEY = "launch:state";

export type LaunchStateMode = "private-test" | "test-ready" | "launched";

export type LaunchState = {
  mode: LaunchStateMode;
  growthLaunchReadyAt?: string;
  launchedAt?: string;
  launchedBy?: string;
  /** Snapshot of the checklist at the moment of the last transition. */
  checklist?: Array<{ id: string; status: string }>;
  updatedAt: string;
};

export async function getLaunchState(): Promise<LaunchState> {
  const stored = await kvGet<LaunchState>(KEY);
  return (
    stored ?? { mode: "private-test", updatedAt: "never" }
  );
}

export async function setLaunchState(state: LaunchState): Promise<void> {
  await kvSet(KEY, state);
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { serverEnv } = await import("./lib/env");
  try {
    serverEnv();
  } catch (e) {
    console.error("[LOKAVA] " + (e as Error).message);
    throw e;
  }
}

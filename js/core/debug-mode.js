// Debug output is opt-in so normal users do not see cache/Firestore tracing.

export function isDebugMode() {
  try {
    return new URLSearchParams(window.location.search).get("debug") === "1";
  } catch {
    return false;
  }
}

export function debugLog(...args) {
  if (isDebugMode()) console.log(...args);
}

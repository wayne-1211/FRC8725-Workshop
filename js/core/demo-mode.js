// js/core/demo-mode.js — local-only demo mode for developers.
//
// Visiting the app with `?demo=1` skips Google login and Firestore entirely.
// Item and user data is read from / written to localStorage instead (see
// js/services/demo-service.js), so nothing here ever touches real project data.

const PARAM_NAME = "demo";

/** True when the current URL requests demo mode (e.g. index.html?demo=1). */
export function isDemoMode() {
  try {
    return new URLSearchParams(window.location.search).get(PARAM_NAME) === "1";
  } catch {
    return false;
  }
}

/** A fabricated, always-admin "session" shaped like a real Firebase auth session. */
export function buildDemoSession() {
  return {
    demo: true,
    user: {
      uid: "demo-user",
      email: "demo@frc8725-workshop.local",
      displayName: "示範帳號",
      photoURL: "",
    },
    role: "admin",
    profile: {
      displayName: "示範帳號",
      role: "admin",
      enabled: true,
    },
  };
}

/** Leave demo mode: drop ?demo=1 and reload into the normal login flow. */
export function exitDemoMode() {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM_NAME);
  url.hash = "";
  window.location.href = url.toString();
}

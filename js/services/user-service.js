// User administration. Backed by Firestore normally; backed by localStorage
// when ?demo=1 is active (see js/core/demo-mode.js). Authentication accounts
// are never deleted here; removing authorization lets the same Google account
// apply again later.

import { getCurrentUser } from "./auth-service.js";
import { getFirebaseDb } from "../core/firebase-client.js";
import { isDemoMode } from "../core/demo-mode.js";
import { debugLog } from "../core/debug-mode.js";

const AUTHORIZED = "authorizedUsers";
const PENDING = "pendingUsers";

function mapSnapshot(snapshot) {
  return snapshot.docs.map((entry) => ({ uid: entry.id, ...entry.data() }));
}

async function getCollection(db, sdk, collectionName) {
  try {
    debugLog(`[Firestore 讀取] ${collectionName}｜使用者資料`);
    return await sdk.getDocs(sdk.collection(db, collectionName));
  } catch (error) {
    error.collectionName = collectionName;
    throw error;
  }
}

async function firestore() {
  if (!getCurrentUser()) {
    throw Object.assign(new Error("登入狀態已失效"), { code: "unauthenticated" });
  }
  return getFirebaseDb();
}

export async function submitPendingRequest(user) {
  if (isDemoMode()) return; // demo sessions are always pre-authorized
  if (!user) throw Object.assign(new Error("尚未登入"), { code: "unauthenticated" });
  const { db, sdk } = await firestore();
  const reference = sdk.doc(db, PENDING, user.uid);
  debugLog(`[Firestore 讀取] ${PENDING}/${user.uid}｜檢查申請狀態`);
  const existing = await sdk.getDoc(reference);
  const profile = {
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    lastAttemptAt: sdk.serverTimestamp(),
  };
  if (existing.exists()) {
    await sdk.updateDoc(reference, profile);
  } else {
    await sdk.setDoc(reference, { ...profile, requestedAt: sdk.serverTimestamp() });
  }
}

/**
 * 供「作業」頁選擇盒子使用者的候選清單（member 也可讀取；
 * firestore.rules v4 已開放 authorizedUsers 給所有已授權使用者讀取）。
 * 讀取失敗（例如舊版 rules 尚未更新）時回傳空陣列 —— 仍可自行輸入名字，
 * 不會擋住建立盒子。
 */
export async function getAuthorizedUserOptions() {
  try {
    if (isDemoMode()) {
      const { authorized } = await (await import("./demo-service.js")).demoGetManagedUsers();
      return authorized.map(({ uid, displayName, email }) => ({ uid, displayName: displayName || email || uid }));
    }
    const { db, sdk } = await firestore();
    const snapshot = await getCollection(db, sdk, AUTHORIZED);
    return mapSnapshot(snapshot)
      .filter((user) => user.enabled !== false)
      .map(({ uid, displayName, email }) => ({ uid, displayName: displayName || email || uid }));
  } catch (error) {
    console.warn("無法載入使用者候選名單（可自行輸入名字）。", error);
    return [];
  }
}

export async function getManagedUsers() {
  if (isDemoMode()) return (await import("./demo-service.js")).demoGetManagedUsers();
  const { db, sdk } = await firestore();
  const [authorized, pending] = await Promise.all([
    getCollection(db, sdk, AUTHORIZED),
    getCollection(db, sdk, PENDING),
  ]);
  return { authorized: mapSnapshot(authorized), pending: mapSnapshot(pending) };
}

export async function approvePendingUser(pendingUser, { displayName, role }) {
  if (isDemoMode()) return (await import("./demo-service.js")).demoApprovePendingUser(pendingUser, { displayName, role });
  const { db, sdk } = await firestore();
  const batch = sdk.writeBatch(db);
  batch.set(sdk.doc(db, AUTHORIZED, pendingUser.uid), {
    email: pendingUser.email || "",
    displayName: displayName.trim() || pendingUser.displayName || "",
    enabled: true,
    role: role === "admin" ? "admin" : "member",
    photoURL: pendingUser.photoURL || "",
    createdAt: sdk.serverTimestamp(),
    updatedAt: sdk.serverTimestamp(),
  });
  batch.delete(sdk.doc(db, PENDING, pendingUser.uid));
  await batch.commit();
}

export async function updateAuthorizedUser(uid, { displayName, role }) {
  if (isDemoMode()) return (await import("./demo-service.js")).demoUpdateAuthorizedUser(uid, { displayName, role });
  const { db, sdk } = await firestore();
  await sdk.updateDoc(sdk.doc(db, AUTHORIZED, uid), {
    displayName: displayName.trim(),
    role: role === "admin" ? "admin" : "member",
    updatedAt: sdk.serverTimestamp(),
  });
}

export async function deleteAuthorizedUser(uid) {
  if (isDemoMode()) return (await import("./demo-service.js")).demoDeleteAuthorizedUser(uid);
  const { db, sdk } = await firestore();
  await sdk.deleteDoc(sdk.doc(db, AUTHORIZED, uid));
}

export async function deletePendingUser(uid) {
  if (isDemoMode()) return (await import("./demo-service.js")).demoDeletePendingUser(uid);
  const { db, sdk } = await firestore();
  await sdk.deleteDoc(sdk.doc(db, PENDING, uid));
}

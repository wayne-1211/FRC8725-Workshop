// One-off migration: rewrite legacy client-generated item ids
// ("item-<uuid>", e.g. item-0b4aa285-7b40-44fb-8452-d448661d7ddf) back to
// Firestore-native document ids (e.g. iGpGs4hk7kaZ4cd3G1Ra).
//
// Firestore document ids are immutable, so each affected item is recreated
// under a fresh id (same field data, same createdAt) and the old document is
// deleted. Every place that stores an itemId reference is remapped in the same
// pass:
//   - usageBoxes.items[].itemId
//   - prepOrders.lines[].itemId
// activityLogs are immutable audit records (firestore.rules: update -> false)
// and keep their historical itemId snapshot; they are intentionally left alone.
//
// Run it from the browser console on the live, signed-in site by opening the
// app with ?migrate-item-ids=1, then:
//   await migrateLegacyItemIds({ dryRun: true })   // preview only, no writes
//   await migrateLegacyItemIds()                    // perform the migration

import { getFirebaseDb } from "../core/firebase-client.js";

const COLLECTION = "items";
const BOXES = "usageBoxes";
const PREP = "prepOrders";
const CACHE_META = "system/cacheVersions";

// Firestore push ids are 20 chars from a 64-symbol alphabet and never contain a
// hyphen; the legacy scheme always prefixes "item-". Match on that prefix.
const LEGACY_ID = /^item-/;

// Firestore caps a WriteBatch at 500 operations. Each recreated item costs two
// writes (set new + delete old), so keep a safe margin.
const MAX_ITEM_PAIRS_PER_BATCH = 200;

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

/**
 * @param {{ dryRun?: boolean }} [opts]
 * @returns {Promise<{
 *   items: number, boxesUpdated: number, prepOrdersUpdated: number,
 *   dryRun: boolean, mapping: Array<{oldId: string, newId: string}>
 * }>}
 */
export async function migrateLegacyItemIds({ dryRun = false } = {}) {
  const { db, sdk } = await getFirebaseDb();

  // 1. Find every legacy item and pre-assign a fresh Firestore id.
  const itemsSnap = await sdk.getDocs(sdk.collection(db, COLLECTION));
  const remap = new Map(); // oldId -> { newId, data }
  for (const docSnap of itemsSnap.docs) {
    if (!LEGACY_ID.test(docSnap.id)) continue;
    const newId = sdk.doc(sdk.collection(db, COLLECTION)).id;
    remap.set(docSnap.id, { newId, data: docSnap.data() });
  }

  const summary = {
    items: remap.size,
    boxesUpdated: 0,
    prepOrdersUpdated: 0,
    dryRun,
    mapping: [...remap.entries()].map(([oldId, v]) => ({ oldId, newId: v.newId })),
  };

  if (remap.size === 0) {
    console.log("[migrate] 沒有需要轉換的物品 id。");
    return summary;
  }

  // 2. Discover which usageBoxes / prepOrders reference any legacy id so we can
  //    report the scope even in a dry run, and rewrite them for real below.
  const boxesSnap = await sdk.getDocs(sdk.collection(db, BOXES));
  const boxUpdates = []; // { ref, items }
  for (const boxSnap of boxesSnap.docs) {
    const entries = Array.isArray(boxSnap.data().items) ? boxSnap.data().items : [];
    if (!entries.some((e) => remap.has(e?.itemId))) continue;
    const nextItems = entries.map((e) =>
      remap.has(e?.itemId) ? { ...e, itemId: remap.get(e.itemId).newId } : e);
    boxUpdates.push({ ref: sdk.doc(db, BOXES, boxSnap.id), items: nextItems });
  }
  summary.boxesUpdated = boxUpdates.length;

  const prepSnap = await sdk.getDocs(sdk.collection(db, PREP));
  const prepUpdates = []; // { ref, lines }
  for (const orderSnap of prepSnap.docs) {
    const lines = Array.isArray(orderSnap.data().lines) ? orderSnap.data().lines : [];
    if (!lines.some((l) => remap.has(l?.itemId))) continue;
    const nextLines = lines.map((l) =>
      remap.has(l?.itemId) ? { ...l, itemId: remap.get(l.itemId).newId } : l);
    prepUpdates.push({ ref: sdk.doc(db, PREP, orderSnap.id), lines: nextLines });
  }
  summary.prepOrdersUpdated = prepUpdates.length;

  if (dryRun) {
    console.log("[migrate] 預覽（未寫入）：", summary);
    return summary;
  }

  // 3. Recreate items under new ids (set new + delete old), chunked per batch.
  for (const pairs of chunk([...remap.entries()], MAX_ITEM_PAIRS_PER_BATCH)) {
    const batch = sdk.writeBatch(db);
    for (const [oldId, { newId, data }] of pairs) {
      const { id: _ignore, ...fields } = data; // items never store an id field, but be safe
      batch.set(sdk.doc(db, COLLECTION, newId), fields);
      batch.delete(sdk.doc(db, COLLECTION, oldId));
    }
    await batch.commit();
  }

  // 4. Rewrite references. Box/prep update rules require createdByUid & createdAt
  //    to stay untouched, so only the array + updatedAt are written.
  for (const { ref, items } of boxUpdates) {
    await sdk.updateDoc(ref, { items, updatedAt: sdk.serverTimestamp() });
  }
  for (const { ref, lines } of prepUpdates) {
    await sdk.updateDoc(ref, { lines, updatedAt: sdk.serverTimestamp() });
  }

  // 5. Bump the lightweight items version so every client re-fetches instead of
  //    serving a stale snapshot that still points at the deleted ids.
  const version = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await sdk.setDoc(
    sdk.doc(db, CACHE_META),
    { items: version, updatedAt: sdk.serverTimestamp() },
    { merge: true },
  );

  console.log("[migrate] 完成：", summary);
  return summary;
}

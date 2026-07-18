// js/services/demo-service.js — localStorage-backed data for demo mode (?demo=1).
//
// Mirrors the function surface of firebase-service.js (fbGetItems, fbCreateItem, ...)
// and user-service.js (getManagedUsers, approvePendingUser, ...) so data-service.js
// and user-service.js can swap this in without callers knowing the difference.
// Nothing here ever reaches Firebase; all state lives in localStorage under
// "workshop.demo.*" keys and is seeded on first use.

const ITEMS_KEY = "workshop.demo.items";
const AUTHORIZED_KEY = "workshop.demo.authorizedUsers";
const PENDING_KEY = "workshop.demo.pendingUsers";

function nowIso() {
  return new Date().toISOString();
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage disabled / full — demo mode just stops persisting silently */
  }
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------------- seed data ---------------- */

function seedItems() {
  const t = nowIso();
  const base = (overrides) => ({
    tags: [], description: "", imageUrl: "", createdAt: t, updatedAt: t, ...overrides,
  });
  return [
    base({ id: makeId("item"), name: "棘輪扳手組", category: "tool", storageId: "tool-cart-c", sectionId: "c7", status: "available", quantity: 3, totalQuantity: 3, tags: ["常用"] }),
    base({ id: makeId("item"), name: "氣動攻牙機", category: "tool", storageId: "tool-cart-c", sectionId: "c3", status: "available", quantity: 2, totalQuantity: 2 }),
    base({ id: makeId("item"), name: "攻牙鑽", category: "tool", storageId: "tool-cart-c", sectionId: "c3", status: "available", quantity: 25, totalQuantity: 25 }),
    base({ id: makeId("item"), name: "氣動倒角機", category: "tool", storageId: "tool-cart-c", sectionId: "c3", status: "available", quantity: 1, totalQuantity: 1 }),
    base({ id: makeId("item"), name: "風槍", category: "tool", storageId: "tool-cart-c", sectionId: "c7", status: "available", quantity: 1, totalQuantity: 1 }),
    base({ id: makeId("item"), name: "F 夾", category: "tool", storageId: "tool-cart-c", sectionId: "c5", status: "available", quantity: 4, totalQuantity: 5, tags: ["常用"] }),
    base({ id: makeId("item"), name: "氣動釘槍", category: "tool", storageId: "tool-cart-c", sectionId: "c3", status: "in-use", quantity: 0, totalQuantity: 1 }),
    base({ id: makeId("item"), name: "威克士 WORX 電鑽", category: "tool", storageId: "tool-cart-c", sectionId: "c1", status: "available", quantity: 4, totalQuantity: 4 }),
    base({ id: makeId("item"), name: "攻牙鑽夾頭", category: "tool", storageId: "tool-cart-c", sectionId: "c3", status: "available", quantity: 12, totalQuantity: 12 }),
    base({ id: makeId("item"), name: "膠槌", category: "tool", storageId: "tool-cart-c", sectionId: "c5", status: "available", quantity: 2, totalQuantity: 2 }),
    base({ id: makeId("item"), name: "各式膠帶", category: "material", storageId: "tool-cart-c", sectionId: "c6", quantity: 14, minimumQuantity: 20, unit: "捲", quantityMode: "approximate", tags: ["常用"] }),
    base({ id: makeId("item"), name: "M3 螺絲", category: "material", storageId: "quick-box-front", sectionId: "b2", quantity: 320, minimumQuantity: 100, unit: "顆" }),
    base({ id: makeId("item"), name: "束線帶", category: "material", storageId: "quick-box-front", sectionId: "b5", quantity: 8, minimumQuantity: 30, unit: "包" }),
    base({ id: makeId("item"), name: "3D 列印線材", category: "material", storageId: "dry-box-a", sectionId: "t1", quantity: 2, minimumQuantity: 3, unit: "捲", tags: ["軟體"] }),
    base({ id: makeId("item"), name: "碳纖維板", category: "material", storageId: "cabinet-15", sectionId: "s1", quantity: 6, minimumQuantity: 4, unit: "片" }),
    base({ id: makeId("item"), name: "電動起子", category: "tool", storageId: "cabinet-16", sectionId: "s2", status: "available", quantity: 2, totalQuantity: 2 }),
    base({ id: makeId("item"), name: "游標卡尺", category: "tool", storageId: "cabinet-17", sectionId: "s0", status: "wishlist", quantity: 0, totalQuantity: 0 }),
    base({ id: makeId("item"), name: "電木夾", category: "tool", storageId: "pegboard", sectionId: "p11", status: "available", quantity: 6, totalQuantity: 6 }),
    base({ id: makeId("item"), name: "護目鏡", category: "material", storageId: "pegboard", sectionId: "p41", quantity: 5, minimumQuantity: 5, unit: "個" }),
  ];
}

function seedAuthorizedUsers() {
  const t = nowIso();
  return [
    { uid: "demo-user", email: "demo@frc8725-workshop.local", displayName: "示範帳號", photoURL: "", role: "admin", enabled: true, createdAt: t, updatedAt: t },
    { uid: "demo-member-1", email: "member1@example.com", displayName: "示範隊員 A", photoURL: "", role: "member", enabled: true, createdAt: t, updatedAt: t },
  ];
}

function seedPendingUsers() {
  const t = nowIso();
  return [
    { uid: "demo-pending-1", email: "pending1@example.com", displayName: "示範新成員", photoURL: "", requestedAt: t, lastAttemptAt: t },
  ];
}

function loadItems() {
  let items = readJSON(ITEMS_KEY, null);
  if (!items) {
    items = seedItems();
    writeJSON(ITEMS_KEY, items);
  }
  return items;
}
function saveItems(items) { writeJSON(ITEMS_KEY, items); }

function loadAuthorized() {
  let users = readJSON(AUTHORIZED_KEY, null);
  if (!users) {
    users = seedAuthorizedUsers();
    writeJSON(AUTHORIZED_KEY, users);
  }
  return users;
}
function saveAuthorized(users) { writeJSON(AUTHORIZED_KEY, users); }

function loadPending() {
  let users = readJSON(PENDING_KEY, null);
  if (!users) {
    users = seedPendingUsers();
    writeJSON(PENDING_KEY, users);
  }
  return users;
}
function savePending(users) { writeJSON(PENDING_KEY, users); }

/* ---------------- items (mirrors firebase-service.js) ---------------- */

export async function fbGetItems() {
  return loadItems().map((item) => ({ ...item }));
}

export async function fbGetItemById(itemId) {
  const item = loadItems().find((i) => i.id === itemId);
  return item ? { ...item } : null;
}

export async function fbCreateItem(itemData) {
  const items = loadItems();
  const created = { ...itemData, id: makeId("item"), createdAt: nowIso(), updatedAt: nowIso() };
  items.push(created);
  saveItems(items);
  return { ...created };
}

export async function fbUpdateItem(itemId, updates) {
  const items = loadItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index < 0) throw Object.assign(new Error("找不到物品"), { code: "not-found" });
  items[index] = { ...items[index], ...updates, id: itemId, updatedAt: nowIso() };
  saveItems(items);
  return { ...items[index] };
}

export async function fbAdjustItemQuantity(itemId, delta) {
  if (delta !== 1 && delta !== -1) throw new Error("數量調整值必須是 1 或 -1");
  const items = loadItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index < 0) throw Object.assign(new Error("找不到物品"), { code: "not-found" });
  const item = items[index];
  const current = Math.max(0, Number(item.quantity) || 0);
  const total = Math.max(0, Number(item.totalQuantity ?? item.quantity) || 0);
  const quantity = item.category === "tool"
    ? Math.min(total, Math.max(0, current + delta))
    : Math.max(0, current + delta);
  if (quantity === current) {
    const code = delta < 0 ? "quantity-empty" : "quantity-full";
    throw Object.assign(new Error(delta < 0 ? "數量已經是 0" : "工具已全部歸還"), { code });
  }
  items[index] = { ...item, quantity, updatedAt: nowIso() };
  saveItems(items);
  return { ...items[index] };
}

export async function fbDeleteItem(itemId) {
  saveItems(loadItems().filter((i) => i.id !== itemId));
  return true;
}

/* ---------------- users (mirrors user-service.js) ---------------- */

export async function demoGetManagedUsers() {
  return { authorized: loadAuthorized().map((u) => ({ ...u })), pending: loadPending().map((u) => ({ ...u })) };
}

export async function demoApprovePendingUser(pendingUser, { displayName, role }) {
  const authorized = loadAuthorized();
  authorized.push({
    uid: pendingUser.uid,
    email: pendingUser.email || "",
    displayName: (displayName || "").trim() || pendingUser.displayName || "",
    enabled: true,
    role: role === "admin" ? "admin" : "member",
    photoURL: pendingUser.photoURL || "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  saveAuthorized(authorized);
  savePending(loadPending().filter((u) => u.uid !== pendingUser.uid));
}

export async function demoUpdateAuthorizedUser(uid, { displayName, role }) {
  const authorized = loadAuthorized();
  const index = authorized.findIndex((u) => u.uid === uid);
  if (index < 0) throw Object.assign(new Error("找不到使用者"), { code: "not-found" });
  authorized[index] = {
    ...authorized[index],
    displayName: (displayName || "").trim(),
    role: role === "admin" ? "admin" : "member",
    updatedAt: nowIso(),
  };
  saveAuthorized(authorized);
}

export async function demoDeleteAuthorizedUser(uid) {
  saveAuthorized(loadAuthorized().filter((u) => u.uid !== uid));
}

export async function demoDeletePendingUser(uid) {
  savePending(loadPending().filter((u) => u.uid !== uid));
}

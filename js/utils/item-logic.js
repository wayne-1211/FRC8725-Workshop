// js/utils/item-logic.js — 純函式的物品領域邏輯（工具狀態、數量格式、排序、庫存邊界）。
//
// 這個模組不可依賴 DOM 或 Firebase，讓 Node 也能直接 import 做單元測試
// （見 tests/unit.test.mjs）。所有會修改工具數量的服務（快速使用／歸還、
// 盒子取用／歸還、備料取料、新增／編輯表單）都必須經過這裡的規則，
// 避免各頁自行判斷造成不一致。

/* ---------------- 工具狀態 ---------------- */

// 一般庫存狀態：數量變動時可自動在兩者間切換。
const NORMAL_STATUSES = ["available", "in-use"];

/** 特殊狀態（wishlist、maintenance、unavailable…）不因數量變動被覆蓋。 */
export function isSpecialStatus(status) {
  return !NORMAL_STATUSES.includes(status);
}

/** 可否被盒子／快速按鈕取用：特殊狀態的工具不可取用。 */
export function isToolTakable(item) {
  return item?.category === "tool" && !isSpecialStatus(item.status);
}

/**
 * 依可用數量與總數量推導工具狀態。
 * - 原狀態為特殊狀態時：維持原狀態（不被數量變動覆蓋）。
 * - quantity <  totalQuantity → "in-use"
 * - quantity === totalQuantity → "available"
 */
export function deriveToolStatus(currentStatus, quantity, totalQuantity) {
  if (isSpecialStatus(currentStatus)) return currentStatus;
  const q = Number(quantity) || 0;
  const total = Number(totalQuantity) || 0;
  return q < total ? "in-use" : "available";
}

/**
 * 套用數量變動到一個工具／材料，回傳 { quantity, status } 或丟出帶 code 的錯誤。
 * 工具邊界：0 <= quantity <= totalQuantity；材料邊界：quantity >= 0。
 * @param {object} item - 現有資料（不會被修改）
 * @param {number} delta - 正數為歸還／補充，負數為取用
 */
export function applyQuantityChange(item, delta) {
  const change = Number(delta);
  if (!Number.isInteger(change) || change === 0) {
    throw Object.assign(new Error("數量變動必須是非零整數"), { code: "invalid-delta" });
  }
  const current = Math.max(0, Number(item.quantity) || 0);
  if (item.category === "tool") {
    if (isSpecialStatus(item.status) && change < 0) {
      throw Object.assign(new Error(`「${item.name}」目前為特殊狀態，無法取用`), { code: "special-status" });
    }
    const total = Math.max(0, Number(item.totalQuantity ?? item.quantity) || 0);
    const next = current + change;
    if (next < 0) {
      throw Object.assign(new Error(`「${item.name}」可用數量不足（剩 ${current}）`), { code: "insufficient" });
    }
    if (next > total) {
      throw Object.assign(new Error(`「${item.name}」歸還後將超過總數量（${total}）`), { code: "over-total" });
    }
    return { quantity: next, status: deriveToolStatus(item.status, next, total) };
  }
  const next = current + change;
  if (next < 0) {
    throw Object.assign(new Error(`「${item.name}」庫存不足（剩 ${current}）`), { code: "insufficient" });
  }
  return { quantity: next, status: item.status ?? "available" };
}

/* ---------------- 材料數量格式 ---------------- */

/**
 * 材料數量文字。quantityMode === "exact" 不加「約」；
 * 舊資料沒有 quantityMode 時視為 approximate。
 */
export function formatMaterialQuantity(item) {
  if (item.quantity == null || item.quantity === "") return "—";
  const q = Number(item.quantity);
  if (!Number.isFinite(q)) return "—";
  const unit = item.unit || "";
  const mode = item.quantityMode === "exact" ? "exact" : "approximate";
  return mode === "exact" ? `${q}${unit}` : `約 ${q}${unit}`;
}

/* ---------------- 名稱排序 ---------------- */

const nameCollator = new Intl.Collator("zh-Hant", { numeric: true, sensitivity: "base" });

/** 中文友善、不分大小寫、數字感知的名稱比較器。 */
export function compareNames(a, b) {
  return nameCollator.compare(String(a ?? ""), String(b ?? ""));
}

/**
 * 依顯示名稱升冪排序（回傳新陣列，不改動原陣列）。
 * @param {Array} list
 * @param {(entry)=>string} [getName] - 預設取 entry.name
 */
export function sortByName(list, getName = (entry) => entry?.name) {
  return [...(list || [])].sort((a, b) => compareNames(getName(a), getName(b)));
}

/* ---------------- 時間 ---------------- */

/** Firestore Timestamp / ISO 字串 / Date → epoch 毫秒（無法解析回傳 0）。 */
export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") { try { return value.toMillis(); } catch { return 0; } }
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const d = value instanceof Date ? value : new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

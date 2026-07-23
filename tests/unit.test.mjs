// tests/unit.test.mjs — 輕量單元測試（node --test tests/）
// 覆蓋：工具狀態計算、材料數量格式、名稱排序、庫存邊界。

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveToolStatus, isSpecialStatus, isToolTakable, applyQuantityChange,
  formatMaterialQuantity, compareNames, sortByName, toMillis,
} from "../js/utils/item-logic.js";

/* ---------------- 工具狀態計算 ---------------- */

test("deriveToolStatus：quantity < totalQuantity → in-use", () => {
  assert.equal(deriveToolStatus("available", 2, 3), "in-use");
  assert.equal(deriveToolStatus("in-use", 0, 3), "in-use");
});

test("deriveToolStatus：quantity === totalQuantity → available", () => {
  assert.equal(deriveToolStatus("in-use", 3, 3), "available");
  assert.equal(deriveToolStatus("available", 0, 0), "available");
});

test("deriveToolStatus：特殊狀態不被數量覆蓋", () => {
  assert.equal(deriveToolStatus("wishlist", 0, 3), "wishlist");
  assert.equal(deriveToolStatus("maintenance", 3, 3), "maintenance");
  assert.equal(deriveToolStatus("unavailable", 1, 3), "unavailable");
});

test("isSpecialStatus / isToolTakable", () => {
  assert.equal(isSpecialStatus("available"), false);
  assert.equal(isSpecialStatus("in-use"), false);
  assert.equal(isSpecialStatus("wishlist"), true);
  assert.equal(isToolTakable({ category: "tool", status: "available" }), true);
  assert.equal(isToolTakable({ category: "tool", status: "wishlist" }), false);
  assert.equal(isToolTakable({ category: "material" }), false);
});

/* ---------------- 庫存邊界 ---------------- */

const tool = { name: "電鑽", category: "tool", status: "available", quantity: 3, totalQuantity: 3 };
const material = { name: "M3 螺絲", category: "material", quantity: 10, unit: "顆" };

test("applyQuantityChange：工具取用後狀態轉 in-use", () => {
  const result = applyQuantityChange(tool, -2);
  assert.deepEqual(result, { quantity: 1, status: "in-use" });
});

test("applyQuantityChange：工具全部歸還後轉 available", () => {
  const result = applyQuantityChange({ ...tool, quantity: 1, status: "in-use" }, 2);
  assert.deepEqual(result, { quantity: 3, status: "available" });
});

test("applyQuantityChange：工具不可扣到負數", () => {
  assert.throws(() => applyQuantityChange({ ...tool, quantity: 1 }, -2), /可用數量不足/);
  try { applyQuantityChange({ ...tool, quantity: 0 }, -1); assert.fail(); }
  catch (err) { assert.equal(err.code, "insufficient"); }
});

test("applyQuantityChange：工具歸還不可超過總數量", () => {
  try { applyQuantityChange({ ...tool, quantity: 3 }, 1); assert.fail(); }
  catch (err) { assert.equal(err.code, "over-total"); }
});

test("applyQuantityChange：特殊狀態工具不可取用、但可補正歸還", () => {
  try { applyQuantityChange({ ...tool, status: "wishlist", quantity: 1 }, -1); assert.fail(); }
  catch (err) { assert.equal(err.code, "special-status"); }
});

test("applyQuantityChange：材料不可扣成負數、可自由補充", () => {
  assert.equal(applyQuantityChange(material, -10).quantity, 0);
  assert.equal(applyQuantityChange(material, 5).quantity, 15);
  try { applyQuantityChange(material, -11); assert.fail(); }
  catch (err) { assert.equal(err.code, "insufficient"); }
});

test("applyQuantityChange：拒絕非整數與零變動", () => {
  assert.throws(() => applyQuantityChange(material, 0));
  assert.throws(() => applyQuantityChange(material, 1.5));
});

/* ---------------- 材料數量格式 ---------------- */

test("formatMaterialQuantity：approximate 顯示「約」", () => {
  assert.equal(formatMaterialQuantity({ quantity: 120, unit: "顆", quantityMode: "approximate" }), "約 120顆");
});

test("formatMaterialQuantity：exact 不顯示「約」", () => {
  assert.equal(formatMaterialQuantity({ quantity: 8, unit: "捲", quantityMode: "exact" }), "8捲");
});

test("formatMaterialQuantity：舊資料沒有 quantityMode 視為 approximate", () => {
  assert.equal(formatMaterialQuantity({ quantity: 5, unit: "包" }), "約 5包");
});

test("formatMaterialQuantity：無法解析的數量顯示 —", () => {
  assert.equal(formatMaterialQuantity({ quantity: null, unit: "包" }), "—");
});

/* ---------------- 名稱排序 ---------------- */

test("compareNames：數字感知（櫃 2 < 櫃 10）", () => {
  assert.ok(compareNames("櫃 2", "櫃 10") < 0);
  assert.ok(compareNames("item-9", "item-10") < 0);
});

test("compareNames：不分大小寫", () => {
  assert.equal(compareNames("abc", "ABC"), 0);
});

test("sortByName：依名稱升冪且不改動原陣列", () => {
  const source = [{ name: "櫃 10" }, { name: "櫃 2" }, { name: "櫃 1" }];
  const sorted = sortByName(source);
  assert.deepEqual(sorted.map((entry) => entry.name), ["櫃 1", "櫃 2", "櫃 10"]);
  assert.equal(source[0].name, "櫃 10"); // 原陣列不變
});

/* ---------------- 時間 ---------------- */

test("toMillis：支援 ISO 字串、Firestore Timestamp 形狀與無效值", () => {
  assert.equal(toMillis("2026-01-02T00:00:00.000Z"), Date.parse("2026-01-02T00:00:00.000Z"));
  assert.equal(toMillis({ seconds: 100 }), 100000);
  assert.equal(toMillis({ toMillis: () => 123 }), 123);
  assert.equal(toMillis(null), 0);
  assert.equal(toMillis("not-a-date"), 0);
});

// js/pages/logs.js — 管理員限定的稽核紀錄頁。
//
// Router 已限制 roles: ["admin"]（member 手動輸入 hash 也會被導回 home）；
// Firestore rules 另外限制只有 admin 可讀 activityLogs，前端擋不住的也讀不到。
// Log 可由管理員在二次確認後全部清空。

import { el, formatDateTime } from "../utils/utils.js";
import { compareNames, toMillis } from "../utils/item-logic.js";
import { initLabels, categoryTag, makeBadge } from "../ui/labels.js";
import { getActivityLogs, clearActivityLogs } from "../services/ops-service.js";
import { confirmModal } from "../ui/modal.js";
import { notify } from "../ui/notifications.js";
import { firestoreErrorMessage } from "../services/auth-service.js";

const ACTION_LABELS = {
  take: { label: "取用", color: "#ffbc5e" },
  return: { label: "歸還", color: "#7dff95" },
};
const SOURCE_LABELS = {
  box: "盒子",
  prep: "備料單",
  direct: "快速操作",
};

let state = null;

export async function mountPage({ session, routeTo }) {
  // 雙重保險：router 已依 roles 擋下，這裡再驗證一次。
  if (session.role !== "admin") { routeTo("home"); return; }

  state = {
    logs: [],
    loading: true,
    loadError: null,
    query: "",
    action: "",
    source: "",
    category: "",
    from: "",
    to: "",
    sortField: "at",
    sortDir: "desc",
  };

  wireFilters();
  document.getElementById("refresh-logs")?.addEventListener("click", loadLogs);
  document.getElementById("clear-logs")?.addEventListener("click", handleClearLogs);
  await Promise.all([loadLogs(), initLabels()]);
}

async function handleClearLogs() {
  if (!state.logs.length) { notify.warning("目前沒有可清除的 Log"); return; }
  const confirmed = await confirmModal({
    title: "清空 Log",
    message: `確定永久刪除全部 Log 嗎？（目前載入 ${state.logs.length} 筆）`,
    detail: "這項操作無法復原，且不會影響目前庫存、使用狀態或備料單。",
    confirmText: "全部清空",
    danger: true,
  });
  if (!confirmed) return;
  const button = document.getElementById("clear-logs");
  button.disabled = true;
  button.textContent = "清除中…";
  try {
    const count = await clearActivityLogs();
    notify.success(`已清除 ${count} 筆 Log`);
    await loadLogs();
  } catch (err) {
    console.error(err);
    notify.danger("清除失敗：" + firestoreErrorMessage(err));
  } finally {
    button.disabled = false;
    button.textContent = "清空 Log";
  }
}

async function loadLogs() {
  state.loading = true;
  state.loadError = null;
  renderLogs();
  try {
    state.logs = await getActivityLogs({ max: 500 });
  } catch (err) {
    console.error(err);
    state.loadError = err.code === "permission-denied"
      ? "沒有讀取 Log 的權限（僅限管理員）。若你已是管理員，請到 Firebase Console 發布最新的 firestore.rules（需包含 activityLogs 規則）。"
      : firestoreErrorMessage(err);
    notify.danger(state.loadError);
  }
  state.loading = false;
  renderLogs();
}

function wireFilters() {
  const bind = (id, key, event = "input") => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener(event, () => {
      state[key] = node.value;
      renderLogs();
    });
  };
  bind("log-search", "query");
  bind("log-action", "action", "change");
  bind("log-source", "source", "change");
  bind("log-category", "category", "change");
  bind("log-from", "from", "change");
  bind("log-to", "to", "change");
  bind("log-sort", "sortField", "change");
  bind("log-dir", "sortDir", "change");
}

function filteredLogs() {
  const query = state.query.trim().toLowerCase();
  const fromMs = state.from ? new Date(`${state.from}T00:00:00`).getTime() : null;
  const toMs = state.to ? new Date(`${state.to}T23:59:59.999`).getTime() : null;

  let logs = state.logs.filter((log) => {
    if (state.action && log.action !== state.action) return false;
    if (state.source && log.source !== state.source) return false;
    if (state.category && log.itemCategory !== state.category) return false;
    const ms = toMillis(log.at);
    if (fromMs != null && (ms === 0 || ms < fromMs)) return false;
    if (toMs != null && (ms === 0 || ms > toMs)) return false;
    if (query) {
      const haystack = [
        log.userName, log.actorName, log.itemName, log.boxName, log.prepOrderName,
      ].map((value) => String(value || "").toLowerCase()).join(" ");
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const direction = state.sortDir === "asc" ? 1 : -1;
  const field = state.sortField;
  logs.sort((a, b) => {
    let compared;
    if (field === "at") compared = toMillis(a.at) - toMillis(b.at);
    else if (field === "quantity") compared = (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
    else compared = compareNames(a[field], b[field]);
    return compared * direction;
  });
  return logs;
}

function renderLogs() {
  const host = document.getElementById("log-list");
  const count = document.getElementById("log-count");
  if (!host) return;
  host.replaceChildren();

  if (state.loading) {
    host.appendChild(el("div", { class: "state-block" }, el("div", { class: "spinner" }), "載入紀錄…"));
    return;
  }
  if (state.loadError) {
    host.appendChild(el("div", { class: "state-block" },
      el("div", { class: "st-title" }, "無法載入 Log"),
      el("div", { class: "st-msg" }, state.loadError)));
    if (count) count.textContent = "0";
    return;
  }

  const logs = filteredLogs();
  if (count) count.textContent = String(logs.length);
  if (!logs.length) {
    host.appendChild(el("div", { class: "state-block" },
      el("div", { class: "st-title" }, "沒有符合的紀錄"),
      el("div", { class: "st-msg" }, state.logs.length ? "試試放寬篩選條件。" : "目前還沒有任何取用／歸還紀錄。")));
    return;
  }

  for (const log of logs) host.appendChild(renderLogRow(log));
}

function renderLogRow(log) {
  const action = ACTION_LABELS[log.action] || { label: log.action || "—", color: "#7d7d7d" };
  const sourceName = log.source === "box" ? log.boxName : log.source === "prep" ? log.prepOrderName : null;
  const time = formatDateTime(log.at);
  return el("div", { class: "log-row" },
    el("span", { class: "log-time" }, time || "（時間同步中）"),
    makeBadge(action.label, action.color),
    el("span", { class: "log-source" },
      SOURCE_LABELS[log.source] || log.source || "—",
      sourceName ? `：${sourceName}` : "",
    ),
    log.itemCategory ? categoryTag(log.itemCategory) : el("span", {}),
    el("span", { class: "log-item", title: log.itemName || "" }, log.itemName || "（未命名品項）"),
    el("span", { class: "log-qty" }, `× ${log.quantity}${log.unit || ""}`),
    el("span", { class: "log-user", title: `操作者：${log.actorName || "—"}` },
      `使用者：${log.userName || "—"}`,
      log.actorName && log.actorName !== log.userName ? `（由 ${log.actorName} 操作）` : "",
    ),
  );
}

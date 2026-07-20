// js/services/actor.js — 目前登入者的操作身分（uid + 名稱快照）。
//
// initChrome(session) 在登入完成後設定；登出／清除保護 UI 時清空。
// firebase-service / demo-service 寫入 activityLogs 時由此取得操作者資訊，
// 名稱使用 authorizedUsers profile 的 displayName 快照（demo 模式為示範帳號）。

let activeActor = null;

/** @param {{uid:string, name:string}|null} actor */
export function setActiveActor(actor) {
  activeActor = actor && actor.uid ? { uid: actor.uid, name: actor.name || "" } : null;
}

export function getActiveActor() {
  return activeActor;
}

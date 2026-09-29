// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Kawade502
// Based on XBill 2.1 (Copyright (C) Brian Wellington, Matias Duarte; GPL). See NOTICE.md.

/**
 * XBill Web Remake - Google Apps Script (GAS) Web App
 *
 * - doGet(): index.html をテンプレートとして評価して返す（CSS/JS は include() で読み込む）
 * - getRanking() / submitScore(): ランキングを Script Properties に保存する
 *
 * ランキングはクライアントから申告されたスコアをそのまま保存する遊び用途のものです。
 * 改ざんは防げないため、値の範囲チェックと件数の上限だけを設けています。
 */

const RANKING_KEY = 'XBILL_RANKING';
const RANKING_STORE_MAX = 20;
const RANKING_RETURN_MAX = 10;
const NAME_MAX_LENGTH = 12;
const DEFAULT_NAME = 'NO NAME';
const SCORE_MAX = 10000000;
const LEVEL_MAX = 99;
const LOCK_WAIT_MS = 5000;

const VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('XBill Web Remake')
    .addMetaTag('viewport', VIEWPORT_CONTENT)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** index.html から <?!= include('name') ?> で呼ぶ。別ファイルの内容をそのまま返す。 */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** 上位 RANKING_RETURN_MAX 件を返す。 */
function getRanking() {
  return readRanking_().slice(0, RANKING_RETURN_MAX);
}

/**
 * スコアを登録し、更新後のランキングと今回の順位を返す。
 * @param {boolean=} cleared 全クリアしたときだけ true（省略・true 以外は false 扱い）
 * @return {{ranking: Array<Object>, rank: number}} rank は 1 始まり。圏外は 0。
 */
function submitScore(name, score, level, cleared) {
  const entry = normalizeEntry_(name, score, level, cleared);

  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    const ranking = readRanking_();
    ranking.push(entry);
    ranking.sort(compareEntries_);

    const stored = ranking.slice(0, RANKING_STORE_MAX);
    PropertiesService.getScriptProperties().setProperty(RANKING_KEY, JSON.stringify(stored));

    const top = stored.slice(0, RANKING_RETURN_MAX);
    return { ranking: top, rank: top.indexOf(entry) + 1 };
  } finally {
    lock.releaseLock();
  }
}

// ---- 内部関数（末尾 _ のものは google.script.run から呼べない） ----

function readRanking_() {
  const raw = PropertiesService.getScriptProperties().getProperty(RANKING_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isValidEntry_).sort(compareEntries_) : [];
  } catch (e) {
    return [];
  }
}

function isValidEntry_(e) {
  return !!e && typeof e.name === 'string' &&
    Number.isFinite(e.score) && Number.isFinite(e.level) && Number.isFinite(e.at);
}

/** スコア降順。同点は先に登録された方を上位にする。 */
function compareEntries_(a, b) {
  return (b.score - a.score) || (a.at - b.at);
}

function normalizeEntry_(name, score, level, cleared) {
  const s = toInteger_(score);
  if (s === null || s < 0 || s > SCORE_MAX) throw new Error('スコアが不正です');
  const l = toInteger_(level);
  if (l === null || l < 1 || l > LEVEL_MAX) throw new Error('レベルが不正です');

  return { name: cleanName_(name), score: s, level: l, cleared: cleared === true, at: Date.now() };
}

function toInteger_(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

/** 制御文字・ゼロ幅文字・双方向制御文字を除いて trim し、12 文字（コードポイント単位）に切る。 */
function cleanName_(name) {
  const text = String(name == null ? '' : name)
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, '')
    .trim();
  const clipped = Array.from(text).slice(0, NAME_MAX_LENGTH).join('').trim();
  return clipped || DEFAULT_NAME;
}

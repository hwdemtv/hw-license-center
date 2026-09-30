-- Migration: 新增 D1 限流计数表
-- 背景: 限流主路径从 KV 迁移到 D1 原子计数，规避 KV 每日写入配额(免费版 1000 次/天)。
--       D1 行写入配额独立计算(免费版 10 万行/天)，且单条 UPSERT+RETURNING 即完成计数。
-- 说明: CREATE TABLE IF NOT EXISTS 幂等，已有该表的库重复执行无副作用。

CREATE TABLE IF NOT EXISTS RateLimit (
    key TEXT PRIMARY KEY,                 -- 限流键 (ratelimit:ip:path)
    count INTEGER NOT NULL DEFAULT 0,     -- 当前窗口内计数
    reset_at INTEGER NOT NULL             -- 窗口重置时间 (Unix 秒)
);

-- Migration: 补齐 C 端自助解绑额度字段 (unbind_count / last_unbind_period)
-- 背景: 旧版 schema.sql 的 Licenses 建表语句缺失这两列，但 /unbind 与 /portal/devices
--       接口依赖它们。从旧版 schema 创建且尚未手工加列的库执行本脚本补齐。
-- 注意: 已含这两列的库（如线上已手工迁移过的）请勿重复执行，会报 duplicate column 错误。
--       全新部署无需执行，新 schema.sql 已内建这两列。

ALTER TABLE Licenses ADD COLUMN unbind_count INTEGER DEFAULT 0;
ALTER TABLE Licenses ADD COLUMN last_unbind_period TEXT;

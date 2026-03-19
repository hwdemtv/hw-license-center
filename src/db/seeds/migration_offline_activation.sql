-- Migration: 添加离线激活预绑定字段
-- 执行时间: 2026-03-19
-- 说明: 为离线激活功能添加 prebound_device_id 字段

-- 添加预绑定设备ID字段
ALTER TABLE Licenses ADD COLUMN prebound_device_id TEXT DEFAULT NULL;

-- 创建索引加速预绑定设备查询
CREATE INDEX IF NOT EXISTS idx_licenses_prebound_device_id ON Licenses(prebound_device_id);

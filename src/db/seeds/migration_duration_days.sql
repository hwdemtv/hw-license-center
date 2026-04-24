-- Migration: 支持激活时才开始计算到期时间
-- 说明: 增加 duration_days 字段，并将尚未激活的存量卡密转换为相对天数

-- 1. 添加 duration_days 字段
ALTER TABLE Subscriptions ADD COLUMN duration_days INTEGER DEFAULT NULL;

-- 2. 存量数据转换：将未激活记录的固定过期时间还原为纯时长（天数）
--    julianday 返回的是带有小数的天数，强转为 INTEGER 会自动向下取整
UPDATE Subscriptions 
SET duration_days = CAST( (julianday(expires_at) - julianday(created_at)) AS INTEGER ),
    expires_at = NULL
WHERE expires_at IS NOT NULL 
  AND license_key IN (SELECT license_key FROM Licenses WHERE activated_at IS NULL);

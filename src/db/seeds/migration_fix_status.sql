-- Migration: 修复误将已使用卡密标记为未激活的问题，并修复老数据 status 错误

-- 1. 恢复已经绑定过设备的卡密的 expires_at 原始值（用创建时间 + 记录的时长回推）
UPDATE Subscriptions
SET 
    expires_at = strftime('%Y-%m-%dT%H:%M:%S.000Z', datetime(created_at, '+' || duration_days || ' days')),
    duration_days = NULL
WHERE duration_days IS NOT NULL 
  AND expires_at IS NULL
  AND license_key IN (SELECT license_key FROM Devices);

-- 2. 将已经绑定过设备的卡密标记上 activated_at（回退对其的首次使用时间记录为创建时间）
UPDATE Licenses
SET activated_at = created_at
WHERE activated_at IS NULL 
  AND license_key IN (SELECT DISTINCT license_key FROM Devices);

-- 3. 核心修正：以前系统生成的所有没使用过的卡，状态居然默认是 active，
-- 导致它们永远无法触发 verify 的 inactive 判定。我们将它们强制刷成 inactive。
UPDATE Licenses
SET status = 'inactive'
WHERE license_key NOT IN (SELECT DISTINCT license_key FROM Devices)
  AND status = 'active';

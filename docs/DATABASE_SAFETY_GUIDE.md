# 数据库安全性与灾备维护指南 (Database Safety Guide)

为了防止未来再次发生因部署脚本误执行导致的数据丢失（如 `DROP TABLE` 问题），建议团队遵循以下数据库运维规范：

## 一、 开发原则：坚持“幂等性”设计

**严禁在生产环境脚本中使用破坏性指令。**

1.  **使用 `IF NOT EXISTS`**：所有创建表、索引的指令必须带有该子句。
    *   ❌ `CREATE TABLE Licenses (...)` (若表已存在会报错)
    *   ❌ `DROP TABLE IF EXISTS Licenses; CREATE TABLE Licenses (...)` (**高危：会清空数据**)
    *   ✅ `CREATE TABLE IF NOT EXISTS Licenses (...)` (安全：若存在则跳过)
2.  **增量更新字段**：如果需要给旧表增加字段，不要重新建表，应使用 `ALTER TABLE`。
    *   ✅ `ALTER TABLE Licenses ADD COLUMN new_feature_flag INTEGER DEFAULT 0;`

## 二、 流程规范：引入 Wrangler Migration (迁移机制)

不要手动维护一个巨大的 `schema.sql` 并全量执行。应使用 Cloudflare 推荐的 **Migrations** 流程：

1.  **创建迁移任务**：当需要改表结构时，运行 `npx wrangler d1 migrations create smart-mp-db <描述>`。
2.  **编写增量脚本**：在生成的 `migrations/000x_xxx.sql` 文件中仅编写本次变更的代码（如 `CREATE TABLE` 或 `ALTER TABLE`）。
3.  **灰度测试**：先在本地测试同步，确认无误后再同步到远程。
    *   `npx wrangler d1 migrations apply smart-mp-db --remote`

## 三、 预防机制：环境隔离与人工审核

1.  **代码提交审核 (Code Review)**：在推送代码或执行 `--remote` 指令前，必须全局搜索 SQL 文件中是否包含 `DROP`、`DELETE`、`TRUNCATE` 等关键字。
2.  **敏感操作隔离**：建议将 `schema.sql` 重命名为 `init_schema.sql`，仅在项目首次初始化时使用。后续所有变更文件放在 `migrations/` 目录下。

## 四、 灾备方案：自动化备份

1.  **手动操作前必备份**：在执行任何涉及数据库的 `wrangler` 指令前，养成导出数据的习惯。
    ```bash
    npx wrangler d1 export smart-mp-db --remote --output="./backups/pre_deploy_$(date +%F).sql"
    ```
2.  **利用 Timetravel**：记住 D1 自带 30 天的 **Timetravel** 快速恢复功能。
    *   查看状态：`npx wrangler d1 time-travel info smart-mp-db`
    *   执行回滚：`npx wrangler d1 time-travel restore smart-mp-db --timestamp="<UTC时间>"`

## 五、 权限管理

- 不要将具有数据库写入权限的 `CLOUDFLARE_API_TOKEN` 分发给所有开发环境，仅在受信任的部署终端或 CI/CD 流中使用。

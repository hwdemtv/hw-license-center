import Database from 'better-sqlite3';

export function createD1Mock(db: Database.Database) {
    const d1Mock = {
        prepare: (sql: string) => {
            const stmt = db.prepare(sql);
            const binder = (...args: any[]) => {
                const boundStmt = {
                    all: async () => ({ results: stmt.all(...args), success: true, meta: { served_by: 'mock' } }),
                    run: async () => {
                        const info = stmt.run(...args);
                        return { success: true, results: [], meta: { changes: info.changes, last_insert_row_id: info.lastInsertRowid } };
                    },
                    first: async <T = any>() => stmt.get(...args) as T,
                    raw: async () => stmt.all(...args),
                    bind: (...moreArgs: any[]) => binder(...args, ...moreArgs),
                    __sql: sql,
                    __params: args
                };
                return boundStmt;
            };

            return {
                bind: binder,
                all: async () => ({ results: stmt.all(), success: true, meta: { served_by: 'mock' } }),
                run: async () => {
                    const info = stmt.run();
                    return { success: true, results: [], meta: { changes: info.changes, last_insert_row_id: info.lastInsertRowid } };
                },
                first: async <T = any>() => stmt.get() as T,
                raw: async () => stmt.all(),
                __sql: sql,
                __params: []
            };
        },
        batch: async (stmts: any[]) => {
            const results: any[] = [];
            db.transaction(() => {
                for (const s of stmts) {
                    const sql = s.__sql;
                    const params = s.__params || [];
                    const stmt = db.prepare(sql);

                    // 粗略判断是读还是写
                    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
                    if (isSelect) {
                        results.push({ success: true, results: stmt.all(...params), meta: {} });
                    } else {
                        const info = stmt.run(...params);
                        results.push({ success: true, results: [], meta: { changes: info.changes, last_insert_row_id: info.lastInsertRowid } });
                    }
                }
            })();
            return results;
        },
        exec: async (sql: string) => {
            db.exec(sql);
            return { success: true, results: [], meta: {} };
        }
    };
    return d1Mock;
}

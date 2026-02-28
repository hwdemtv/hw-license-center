/// <reference types="node" />

// 同构数据库驱动适配器
// 用运行时环境探测代替顶层模块依赖，防止 Cloudflare Worker 构建报错
let betterSqlite3Promise: Promise<any> | null = null;
if (typeof process !== 'undefined' && process.env) {
    // 使用动态 import()，避免被打包器静态分析为必须的依赖（特别在 Cloudflare 环境下）
    // 也能解决 ESM (Node.js/tsx) 下没有 require 的问题
    betterSqlite3Promise = import('better-sqlite3').then(m => m.default || m).catch(e => {
        console.error("Failed to dynamically import better-sqlite3:", e.message);
        return null;
    });
}

// 完全模拟 Cloudflare D1 API 签名，以对现有路由逻辑实现 0 侵入替换

export interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: any;
    error?: string;
}

export interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
    // 以下为适配器用于 batch 内部读取提取的私有属性标识
    __sql?: string;
    __params?: any[];
    __isD1Stmt?: boolean;
    __nativeDbPromise?: Promise<any> | null;
}

export class DBAdapter {
    private d1Db: any = null;
    private nativeDbPromise: Promise<any> | null = null;

    constructor(envDb?: any) {
        if (envDb && typeof envDb.prepare === 'function') {
            this.d1Db = envDb;
        } else if (betterSqlite3Promise) {
            this.nativeDbPromise = betterSqlite3Promise.then(Database => {
                if (!Database) {
                    console.warn('⚠️ better-sqlite3 module not loaded dynamically. Ensure you have installed it for VPS deployment.');
                    return null;
                }
                const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite', { fileMustExist: false });
                db.pragma('journal_mode = WAL');
                db.pragma('synchronous = NORMAL');
                db.pragma('cache_size = -64000');
                db.pragma('foreign_keys = ON');
                db.pragma('busy_timeout = 5000');
                return db;
            });
        }
    }

    prepare(query: string): D1PreparedStatement {
        if (this.d1Db) {
            // 在 D1 环境下，完全代理并向外透出其原生语句对象，打上标记，方便 batch 识别
            const stmt = this.d1Db.prepare(query);
            stmt.__isD1Stmt = true;
            return stmt as D1PreparedStatement;
        }

        // 在原生环境下，返回符合 D1 签名的模拟对象
        let boundParams: any[] = [];
        const simulatedStmt: D1PreparedStatement = {
            __sql: query,
            __params: boundParams,
            bind(...values: any[]) {
                boundParams = values;
                this.__params = boundParams;
                return this;
            },
            async first<T = any>(colName?: string): Promise<T | null> {
                const db = this.__nativeDbPromise ? await this.__nativeDbPromise : null;
                if (!db) throw new Error("No DB");
                const stmt = db.prepare(query);
                const result = stmt.get(...boundParams);
                if (!result) return null;
                if (colName) return result[colName] ?? null;
                return result;
            },
            async all<T = any>(): Promise<D1Result<T>> {
                const db = this.__nativeDbPromise ? await this.__nativeDbPromise : null;
                if (!db) throw new Error("No DB");
                const stmt = db.prepare(query);
                const results = stmt.all(...boundParams);
                return { success: true, results, meta: { served_by: 'better-sqlite3' } };
            },
            async run<T = any>(): Promise<D1Result<T>> {
                const db = this.__nativeDbPromise ? await this.__nativeDbPromise : null;
                if (!db) throw new Error("No DB");
                const stmt = db.prepare(query);
                const info = stmt.run(...boundParams);
                return { success: true, results: [], meta: { changes: info.changes, last_insert_row_id: info.lastInsertRowid } };
            },
            async raw<T = any>(): Promise<T[]> {
                throw new Error("raw() is not implemented in generic mock yet");
            }
        };
        // 为了使 simulatedStmt 能读取 nativeDbPromise
        (simulatedStmt as any).__nativeDbPromise = this.nativeDbPromise;

        return simulatedStmt;
    }

    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
        if (this.d1Db) {
            // Cloudflare 原生支持
            return await this.d1Db.batch(statements);
        } else if (this.nativeDbPromise) {
            const db = await this.nativeDbPromise;
            if (!db) throw new Error("No database driver available");
            const results: D1Result<T>[] = [];
            const runBatch = db.transaction(() => {
                for (const stmt of statements) {
                    const sql = stmt.__sql;
                    const params = stmt.__params || [];
                    if (!sql) throw new Error("Invalid statement in batch");

                    const nativeStmt = db.prepare(sql);
                    // 判断语句类型：SELECT 用 all，其余使用 run
                    // 比较粗略的探查
                    const isSelect = sql.trim().toUpperCase().startsWith("SELECT");
                    if (isSelect) {
                        const res = nativeStmt.all(...params);
                        results.push({ success: true, results: res, meta: {} });
                    } else {
                        const info = nativeStmt.run(...params);
                        results.push({ success: true, results: [], meta: { changes: info.changes, last_insert_row_id: info.lastInsertRowid } });
                    }
                }
            });
            runBatch();
            return results;
        } else {
            throw new Error("No database driver available");
        }
    }

    async exec(query: string): Promise<D1Result> {
        if (this.d1Db) {
            return await this.d1Db.exec(query);
        } else if (this.nativeDbPromise) {
            const db = await this.nativeDbPromise;
            if (!db) throw new Error("No database driver available");
            db.exec(query);
            return { success: true, results: [], meta: {} };
        }
        throw new Error("No database driver available");
    }
}

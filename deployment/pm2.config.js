module.exports = {
    apps: [
        {
            name: 'hw-license-center',
            script: './dist/server.js',
            instances: 1, // 由于 SQLite 建议单实例写入，此处设为 1
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};

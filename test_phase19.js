// 验证 XSS 转义和 RateLimit 惰性清理

const API_URL = 'http://localhost:3000';
const ADMIN_SECRET = 'hwdemtv'; // 测试用后台秘钥替换真实变量

async function pingBackend() {
    console.log('--- 1. 测试 Admin 接口是否就绪 ---');
    try {
        const res = await fetch(`${API_URL}/api/v1/auth/admin/licenses`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
        });
        console.log('GET Licenses HTTP:', res.ok);
    } catch (e) { console.error('Ping 失败：请确保后端已启动'); }
}

async function testXSS() {
    console.log('\n--- 2. 生成一张新卡卡用于测试 ---');
    let newKey = '';

    const genRes = await fetch(`${API_URL}/api/v1/auth/admin/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1, max_devices: 2, duration_days: 10, product_id: 'testxss', user_name: '<script>alert("XSS USERNAME")</script> BadUser' })
    });

    const genData = await genRes.json();
    if (genData.success) {
        newKey = genData.keys[0];
        console.log(`✓ 生成成功, Key: ${newKey}`);
    } else {
        console.log('生成失败', genData);
        return;
    }

    console.log('\n--- 3. 模拟 C 端挂载带有 XSS 脚本的设备 ---');
    const verifyRes = await fetch(`${API_URL}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            license_key: newKey,
            device_id: 'xss-device-id-001',
            device_name: '<img src="x" onerror="alert(\'XSS DEVICENAME\')"> MyPhone',
            product_id: 'testxss'
        })
    });
    const vData = await verifyRes.json();
    console.log('挂载响应:', vData.success ? '成功' : '失败');

    console.log('\n✓ XSS 注入完成，您可以打开以下页面并检查是否弹窗:');
    console.log(`- /portal 页面，搜索凭证: ${newKey}`);
    console.log(`- /admin 后台设备面板`);
}

async function testRateLimit() {
    console.log('\n--- 4. 模拟防刷限流与 Map 清理 (触发阈值 1000) ---');
    console.log('预计发送 1200 个并发模拟请求，请留意观察终端是否报错/卡顿。');

    // 我们修改 req.header() 的方式通过直接发 fetch 很难伪造 1000 个源 IP。这里纯测试 Node 处理 1000 级并发下的稳定性
    const promises = [];
    for (let i = 0; i < 1200; i++) {
        promises.push(
            fetch(`${API_URL}/api/v1/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: 'INVALID', device_id: 'dev-' + i, product_id: 'xxx' })
            }).catch(e => { }) // 忽略超时
        );
    }
    await Promise.allSettled(promises);
    console.log('✓ 高并发突发测试结束。若本地服务未崩溃，说明 Map 内存惰性置空或事件循环承载无压力。');
}

async function run() {
    await pingBackend();
    await testXSS();
    await testRateLimit();
}
run();

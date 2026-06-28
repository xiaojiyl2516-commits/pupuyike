// ============================================================
// 浦浦荐逼 - 云端数据同步 (JSONBin.io)
// 依赖: config.js 必须在 cloud.js 之前加载
// ============================================================

// ============================================================
// 浦浦荐逼 - 云端数据同步 (JSONBin.io)
// ============================================================

var CLOUD_CONFIG_KEY = 'ppjb_cloud_config';
// 通过 Vercel 代理调用 JSONBin（解决跨域问题）
async function saveToCloudViaProxy(teachersData) {
    var config = getCloudConfig();
    if (!config || !config.binId) return false;

    try {
        var proxyUrl = window.location.origin + '/api/sync';
        var res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'push',
                binId: config.binId,
                apiKey: config.apiKey || '',
                data: teachersData
            })
        });
        var result = await res.json();
        if (!res.ok) {
            var errMsg = result.error || result.message || ('HTTP ' + res.status);
            throw new Error(errMsg);
        }
        // 代理返回 { success: true, status: 200, data: {...} }
        // 检查代理自己的 success 字段
        if (result.success === true || res.status === 200) {
            console.log('[云同步] 通过代理推送成功');
            return true;
        }
        throw new Error('代理返回异常');
    } catch(e) {
        console.warn('[云同步] 代理推送失败:', e.message);
        return false;
    }
}

async function loadFromCloudViaProxy() {
    var config = getCloudConfig();
    if (!config || !config.binId) return null;

    try {
        var proxyUrl = window.location.origin + '/api/sync';
        var res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'pull',
                binId: config.binId,
                apiKey: config.apiKey || ''
            })
        });
        if (!res.ok) throw new Error('代理返回 ' + res.status);
        var result = await res.json();
        // 代理返回格式: { success: true, data: { record: [...] } }
        // 直连返回格式: { record: [...] }
        // 老格式: 直接是数组 [...]

        // 先看 data.record（代理包装的JSONBin格式）
        if (result.data && result.data.record && Array.isArray(result.data.record)) {
            return result.data.record;
        }
        // 再看 result.record（直连JSONBin格式）
        if (result.record && Array.isArray(result.record)) {
            return result.record;
        }
        // 直接是数组
        if (Array.isArray(result)) return result;
        // result.data 直接是数组
        if (Array.isArray(result.data)) return result.data;
        return null;
    } catch(e) {
        console.warn('[云同步] 代理拉取失败:', e.message);
        return null;
    }
}


function getCloudConfig() {
    // 优先使用 config.js 中的硬编码配置（所有设备共享）
    if (typeof CLOUD_CONFIG !== 'undefined' && CLOUD_CONFIG && CLOUD_CONFIG.binId) {
        return { binId: CLOUD_CONFIG.binId, apiKey: CLOUD_CONFIG.apiKey || '' };
    }
    // 回退到 localStorage 中的配置（兼容 admin.html 中保存的）
    try {
        var raw = localStorage.getItem(CLOUD_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
}

function saveCloudConfig(config) {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

function hasCloudConfig() {
    var c = getCloudConfig();
    // binId 必填，apiKey 可选（没有也能读公共bin）
    return c && c.binId;
}

// 从云端加载数据
async function loadFromCloud() {
    // 优先通过代理（解决跨域）
    try {
        var proxyData = await loadFromCloudViaProxy();
        if (proxyData && proxyData.length > 0) {
            console.log('[云同步] 通过代理加载成功: ' + proxyData.length + ' 位老师');
            return proxyData;
        }
    } catch(e) {
        console.warn('[云同步] 代理加载失败:', e.message);
    }

    // 回退直连
    var config = getCloudConfig();
    if (!config || !config.binId) return null;

    var url = 'https://api.jsonbin.io/v3/b/' + config.binId + '/latest';
    try {
        var headers = {};
        if (config.apiKey) headers['X-Master-Key'] = config.apiKey;
        var res = await fetch(url, { headers: headers });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (data && data.record && Array.isArray(data.record)) {
            console.log('[云同步] 直连加载成功: ' + data.record.length + ' 位老师');
            return data.record;
        }
        if (Array.isArray(data)) {
            console.log('[云同步] 直连加载成功: ' + data.length + ' 位老师');
            return data;
        }
    } catch(e) {
        console.warn('[云同步] 直连加载失败:', e.message);
    }
    return null;
}// 保存数据到云端
async function saveToCloud(teachersData) {
    // 优先通过代理（解决跨域）
    try {
        var ok = await saveToCloudViaProxy(teachersData);
        if (ok) {
            console.log('[云同步] 保存到云端成功');
            return true;
        }
    } catch(e) {
        console.warn('[云同步] 代理保存失败:', e.message);
    }

    // 回退直连
    var config = getCloudConfig();
    if (!config || !config.binId) return false;

    var url = 'https://api.jsonbin.io/v3/b/' + config.binId;
    try {
        var headers = { 'Content-Type': 'application/json' };
        if (config.apiKey) headers['X-Master-Key'] = config.apiKey;
        var res = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(teachersData)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        console.log('[云同步] 直连推送成功');
        return true;
    } catch(e) {
        console.warn('[云同步] 直连推送失败:', e.message);
        return false;
    }
}// 测试代理是否正常工作
async function testProxyConnection() {
    var config = getCloudConfig();
    if (!config || !config.binId) {
        return { ok: false, msg: '请先配置 Bin ID' };
    }

    try {
        var proxyUrl = window.location.origin + '/api/sync';
        var startTime = Date.now();

        var res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'pull',
                binId: config.binId,
                apiKey: config.apiKey || ''
            })
        });

        var elapsed = Date.now() - startTime;
        var result = await res.json();

        if (res.ok && result.success) {
            var recordCount = 0;
            if (result.data && result.data.record && Array.isArray(result.data.record)) {
                recordCount = result.data.record.length;
            } else if (Array.isArray(result.data)) {
                recordCount = result.data.length;
            }
            return { ok: true, msg: '代理正常 (' + elapsed + 'ms) · 云端 ' + recordCount + ' 位老师', data: result };
        } else {
            var errMsg = result.error || result.message || 'HTTP ' + res.status;
            return { ok: false, msg: '代理返回错误: ' + errMsg, raw: result };
        }
    } catch(e) {
        return { ok: false, msg: '无法连接代理: ' + e.message + '\n\n可能原因:\n1. 还没上传 api/sync.js 到 GitHub\n2. Vercel 还没部署完成\n3. 路径不是 /api/sync' };
    }
}

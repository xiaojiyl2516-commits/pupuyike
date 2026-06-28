// ============================================================
// 浦浦荐逼 - 云端数据同步 (JSONBin.io)
// 依赖: config.js 必须在 cloud.js 之前加载
// ============================================================

// ============================================================
// 浦浦荐逼 - 云端数据同步 (JSONBin.io)
// ============================================================

var CLOUD_CONFIG_KEY = 'ppjb_cloud_config';

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
    return c && c.binId && c.apiKey;
}

// 从云端加载数据
async function loadFromCloud() {
    var config = getCloudConfig();
    if (!config || !config.binId) return null;

    var url = 'https://api.jsonbin.io/v3/b/' + config.binId + '/latest';
    try {
        var res = await fetch(url, {
            headers: config.apiKey ? { 'X-Master-Key': config.apiKey } : {}
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        // JSONBin returns { record: {...} }
        if (data && data.record && Array.isArray(data.record)) {
            console.log('[云同步] 从云端加载成功: ' + data.record.length + ' 位老师');
            return data.record;
        }
        // 旧版本可能直接返回数组
        if (Array.isArray(data)) {
            console.log('[云同步] 从云端加载成功: ' + data.length + ' 位老师');
            return data;
        }
    } catch(e) {
        console.warn('[云同步] 加载失败:', e.message);
    }
    return null;
}

// 保存数据到云端
async function saveToCloud(teachersData) {
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

        console.log('[云同步] 保存到云端成功');
        return true;
    } catch(e) {
        console.warn('[云同步] 保存失败:', e.message);
        return false;
    }
}

// 测试连接有效性
async function testCloudConnection(binId, apiKey) {
    try {
        var headers = {};
        if (apiKey) headers['X-Master-Key'] = apiKey;
        var res = await fetch('https://api.jsonbin.io/v3/b/' + binId + '/latest', { headers: headers });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return { ok: true, message: '连接成功' };
    } catch(e) {
        return { ok: false, message: e.message };
    }
}

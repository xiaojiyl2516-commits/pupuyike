// ============================================================
// 浦浦荐逼 - 云端数据同步 (JSONBin.io)
// ============================================================

var CLOUD_CONFIG_KEY = 'ppjb_cloud_config';
var CLOUD_LAST_ERROR = '';

function getCloudConfig() {
    if (typeof CLOUD_CONFIG !== 'undefined' && CLOUD_CONFIG && CLOUD_CONFIG.binId) {
        return { binId: CLOUD_CONFIG.binId, apiKey: CLOUD_CONFIG.apiKey || '' };
    }
    try {
        var raw = localStorage.getItem(CLOUD_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
}

function hasCloudConfig() {
    var c = getCloudConfig();
    return c && c.binId;
}

// ---------- 通过 Vercel 代理 ----------
async function saveToCloudViaProxy(teachersData) {
    var config = getCloudConfig();
    if (!config || !config.binId) { CLOUD_LAST_ERROR = '未配置 Bin ID'; return false; }
    try {
        var proxyUrl = window.location.origin + '/api/sync';
        var res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'push', binId: config.binId, apiKey: config.apiKey || '', data: teachersData })
        });
        var text = await res.text();
        var result;
        try { result = JSON.parse(text); } catch(e) { result = null; }
        if (!res.ok) {
            CLOUD_LAST_ERROR = (result && result.error) || 'HTTP ' + res.status;
            if (result && result.message) CLOUD_LAST_ERROR += ' - ' + result.message;
            return false;
        }
        if (result && result.success === true) { return true; }
        CLOUD_LAST_ERROR = '代理响应格式异常';
        return false;
    } catch(e) {
        CLOUD_LAST_ERROR = '代理连接失败: ' + e.message;
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
            body: JSON.stringify({ action: 'pull', binId: config.binId, apiKey: config.apiKey || '' })
        });
        if (!res.ok) { CLOUD_LAST_ERROR = '拉取 HTTP ' + res.status; return null; }
        var result = await res.json();
        if (result.data && result.data.record && Array.isArray(result.data.record)) return result.data.record;
        if (result.record && Array.isArray(result.record)) return result.record;
        if (Array.isArray(result)) return result;
        if (Array.isArray(result.data)) return result.data;
        CLOUD_LAST_ERROR = '云端数据格式异常';
        return null;
    } catch(e) {
        CLOUD_LAST_ERROR = '拉取失败: ' + e.message;
        return null;
    }
}

// ---------- 直连 JSONBin ----------
async function loadFromCloud() {
    try {
        var proxyData = await loadFromCloudViaProxy();
        if (proxyData && proxyData.length > 0) return proxyData;
    } catch(e) { CLOUD_LAST_ERROR = '代理加载: ' + e.message; }
    var config = getCloudConfig();
    if (!config || !config.binId) return null;
    var url = 'https://api.jsonbin.io/v3/b/' + config.binId + '/latest';
    try {
        var headers = {};
        if (config.apiKey) headers['X-Master-Key'] = config.apiKey;
        var res = await fetch(url, { headers: headers });
        if (!res.ok) { CLOUD_LAST_ERROR = '直连拉取 HTTP ' + res.status; return null; }
        var data = await res.json();
        if (data && data.record && Array.isArray(data.record)) return data.record;
        if (Array.isArray(data)) return data;
        return null;
    } catch(e) {
        CLOUD_LAST_ERROR = '直连拉取失败: ' + e.message + '（浏览器跨域限制，请确保代理可用）';
        return null;
    }
}

async function saveToCloud(teachersData) {
    try {
        var ok = await saveToCloudViaProxy(teachersData);
        if (ok) return true;
    } catch(e) { CLOUD_LAST_ERROR = '代理保存异常: ' + e.message; }
    var config = getCloudConfig();
    if (!config || !config.binId) return false;
    var url = 'https://api.jsonbin.io/v3/b/' + config.binId;
    try {
        var headers = { 'Content-Type': 'application/json' };
        if (config.apiKey) headers['X-Master-Key'] = config.apiKey;
        var res = await fetch(url, { method: 'PUT', headers: headers, body: JSON.stringify(teachersData) });
        if (!res.ok) { CLOUD_LAST_ERROR = '直连推送 HTTP ' + res.status; return false; }
        return true;
    } catch(e) {
        CLOUD_LAST_ERROR = '直连推送失败: ' + e.message + '（浏览器跨域限制，请确保代理可用）';
        return false;
    }
}

async function testProxyConnection() {
    var config = getCloudConfig();
    if (!config || !config.binId) return { ok: false, msg: '请先配置 Bin ID' };
    try {
        var proxyUrl = window.location.origin + '/api/sync';
        var startTime = Date.now();
        var res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pull', binId: config.binId, apiKey: config.apiKey || '' })
        });
        var elapsed = Date.now() - startTime;
        var text = await res.text();
        var result;
        try { result = JSON.parse(text); } catch(e) { result = null; }
        if (res.ok && result && result.success) {
            var recordCount = 0;
            if (result.data && result.data.record && Array.isArray(result.data.record)) recordCount = result.data.record.length;
            else if (Array.isArray(result.data)) recordCount = result.data.length;
            return { ok: true, msg: '代理正常 (' + elapsed + 'ms) · 云端 ' + recordCount + ' 位老师' };
        } else {
            var errMsg = (result && result.error) || 'HTTP ' + res.status;
            if (result && result.message) errMsg += ' - ' + result.message;
            return { ok: false, msg: '代理返回错误: ' + errMsg + '\n\n完整响应:\n' + text.slice(0,300), raw: result };
        }
    } catch(e) {
        return { ok: false, msg: '无法连接代理: ' + e.message + '\n\n可能原因:\n1. 还没上传 api/sync.js 到 GitHub\n2. Vercel 还没部署完成\n3. 路径不是 /api/sync\n4. 需要 vercel.json 配置文件' };
    }
}

function getLastError() { return CLOUD_LAST_ERROR; }
// ============================================================
// 浦浦荐逼 - 云端同步代理 (Vercel Serverless)
// 解决浏览器跨域无法直接写入 JSONBin 的问题
// ============================================================

module.exports = async function handler(req, res) {
    // 只允许 POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '仅支持 POST' });
    }

    // 解析请求体
    var body = req.body || {};
    var binId = body.binId;
    var apiKey = body.apiKey || '';
    var data = body.data;
    var action = body.action || 'push';  // push 或 pull

    if (!binId) {
        return res.status(400).json({ error: '缺少 binId' });
    }

    try {
        if (action === 'push') {
            // 写入 JSONBin
            if (!data) return res.status(400).json({ error: '缺少 data' });

            var headers = { 'Content-Type': 'application/json' };
            if (apiKey) headers['X-Master-Key'] = apiKey;

            var pushRes = await fetch('https://api.jsonbin.io/v3/b/' + binId, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(data)
            });

            var pushResult = await pushRes.json();
            return res.status(pushRes.status).json(pushResult);

        } else if (action === 'pull') {
            // 从 JSONBin 读取
            var headers = {};
            if (apiKey) headers['X-Master-Key'] = apiKey;

            var pullRes = await fetch('https://api.jsonbin.io/v3/b/' + binId + '/latest', {
                headers: headers
            });

            var pullResult = await pullRes.json();
            return res.status(pullRes.status).json(pullResult);

        } else {
            return res.status(400).json({ error: '未知操作: ' + action });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// ============================================================
// 浦浦荐逼 - 云端同步代理 (Vercel Serverless)
// ============================================================

module.exports = async function handler(req, res) {
    // CORS 头（允许同域访问）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '仅支持 POST', method: req.method });
    }

    try {
        // 解析请求体
        if (!req.body) {
            return res.status(400).json({ error: '请求体为空', hint: '请确保 Content-Type: application/json' });
        }

        var body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        var binId = body.binId;
        var apiKey = body.apiKey || '';
        var data = body.data;
        var action = body.action || 'push';

        if (!binId) {
            return res.status(400).json({ error: '缺少 binId' });
        }

        var jsonbinHeaders = { 'Content-Type': 'application/json' };
        if (apiKey) jsonbinHeaders['X-Master-Key'] = apiKey;

        if (action === 'push') {
            if (!data) return res.status(400).json({ error: '缺少 data' });

            var pushRes = await fetch('https://api.jsonbin.io/v3/b/' + binId, {
                method: 'PUT',
                headers: jsonbinHeaders,
                body: JSON.stringify(data)
            });

            var pushResult = await pushRes.text();
            try { pushResult = JSON.parse(pushResult); } catch(e) {}

            return res.status(pushRes.status).json({
                success: pushRes.ok,
                status: pushRes.status,
                data: pushResult
            });

        } else if (action === 'pull') {
            var pullRes = await fetch('https://api.jsonbin.io/v3/b/' + binId + '/latest', {
                headers: jsonbinHeaders
            });

            var pullResult = await pullRes.text();
            try { pullResult = JSON.parse(pullResult); } catch(e) {}

            return res.status(pullRes.status).json({
                success: pullRes.ok,
                status: pullRes.status,
                data: pullResult
            });

        } else {
            return res.status(400).json({ error: '未知操作: ' + action });
        }
    } catch (e) {
        return res.status(500).json({
            error: '代理执行异常',
            message: e.message,
            stack: e.stack
        });
    }
};

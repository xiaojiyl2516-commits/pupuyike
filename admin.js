// ============================================================
// 浦浦荐逼 - 管理后台逻辑
// ============================================================

let editingId = null;
let photoUrls = [''];

function initAdmin() {
    loadData();

    renderAdminTable();

    // Add teacher
    document.getElementById('addTeacherBtn').addEventListener('click', () => {
        openEditor(null);
    });

    // Save
    document.getElementById('editorSave').addEventListener('click', saveTeacher);

    // Cancel
    document.getElementById('editorCancel').addEventListener('click', closeEditor);

    // Add photo
    document.getElementById('addPhotoBtn').addEventListener('click', () => {
        photoUrls.push('');
        renderPhotoInputs();
    });

    // Imgur一键上传
    document.getElementById('imgurFileInput').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            uploadToImgur(this.files[0]);
        }
        this.value = '';
    });
    document.getElementById('uploadNewBtn').addEventListener('click', function() {
        document.getElementById('imgurFileInput').click();
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Import
    document.getElementById('importBtn').addEventListener('click', importData);

    // === 云端同步 ===
    initCloudUI();
}

function renderAdminTable() {
    const countLabel = document.getElementById('dataCountLabel');
    if (countLabel) {
        countLabel.innerHTML = '当前 localStorage 中存储了 <strong style="color:#fff">' + teachers.length + '</strong> 位老师数据';
    }
    const tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = teachers.map(t => `
        <tr>
            <td><strong style="color:#fff">${t.name}</strong></td>
            <td style="color:var(--blue)">@${t.tgHandle}</td>
            <td>${t.district}</td>
            <td style="color:var(--accent);font-weight:700">¥${t.price}</td>
            <td><div class="tag-pills">${t.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}</div></td>
            <td><span class="status-badge ${t.status === '营业中' ? 'online' : 'offline'}">${t.status}</span></td>
            <td>${t.photos.length} 张</td>
            <td>
                <button class="action-btn edit" data-id="${t.id}" title="编辑"><i class="fas fa-edit"></i></button>
                <button class="action-btn toggle" data-id="${t.id}" title="切换状态"><i class="fas fa-sync-alt"></i></button>
                <button class="action-btn delete" data-id="${t.id}" title="删除"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Bind actions
    tbody.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => openEditor(btn.dataset.id));
    });
    tbody.querySelectorAll('.action-btn.toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleStatus(btn.dataset.id));
    });
    tbody.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTeacher(btn.dataset.id));
    });
}

function openEditor(id) {
    editingId = id;
    const t = id ? teachers.find(tc => tc.id === id) : null;

    document.getElementById('editorTitle').textContent = t ? '编辑老师 - ' + t.name : '添加新老师';
    document.getElementById('editId').value = id || '';

    if (t) {
        document.getElementById('editName').value = t.name;
        document.getElementById('editTG').value = t.tgHandle;
        document.getElementById('editDistrict').value = t.district;
        document.getElementById('editPrice').value = t.price;
        document.getElementById('editStatus').value = t.status;
        document.getElementById('editSchedule').value = t.schedule || '';
        document.getElementById('editDiscount').value = t.discount || '';
        document.getElementById('editBio').value = t.bio || '';
        document.getElementById('editTags').value = t.tags.join(', ');
        photoUrls = [...t.photos];
    } else {
        document.getElementById('editName').value = '';
        document.getElementById('editTG').value = '';
        document.getElementById('editDistrict').value = '锦江区';
        document.getElementById('editPrice').value = '';
        document.getElementById('editStatus').value = '营业中';
        document.getElementById('editSchedule').value = '';
        document.getElementById('editDiscount').value = '';
        document.getElementById('editBio').value = '';
        document.getElementById('editTags').value = '';
        photoUrls = [''];
    }

    renderPhotoInputs();
    document.getElementById('editorModal').classList.add('open');
}

function closeEditor() {
    document.getElementById('editorModal').classList.remove('open');
    editingId = null;
}

function renderPhotoInputs() {
    const container = document.getElementById('photoList');
    container.innerHTML = photoUrls.map((url, i) => `
        <div class="photo-input-group">
            <input type="text" class="photo-input" value="${url}" placeholder="照片URL ${i + 1}" data-idx="${i}">
            ${photoUrls.length > 1 ? `<button class="remove-photo-btn" data-idx="${i}"><i class="fas fa-times"></i></button>` : ''}
        </div>
    `).join('');

    container.querySelectorAll('.photo-input').forEach(inp => {
        inp.addEventListener('input', function() {
            photoUrls[parseInt(this.dataset.idx)] = this.value;
        });
    });
    container.querySelectorAll('.remove-photo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            photoUrls.splice(idx, 1);
            if (photoUrls.length === 0) photoUrls = [''];
            renderPhotoInputs();
        });
    });
}

function saveTeacher() {
    const name = document.getElementById('editName').value.trim();
    const tg = document.getElementById('editTG').value.trim();
    const district = document.getElementById('editDistrict').value;
    const price = parseInt(document.getElementById('editPrice').value);
    const status = document.getElementById('editStatus').value;
    const schedule = document.getElementById('editSchedule').value.trim();
    const discount = document.getElementById('editDiscount').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const tagsRaw = document.getElementById('editTags').value.trim();

    if (!name || !tg || !price) {
        alert('请填写花名、TG账号和价格（必填项）');
        return;
    }

    const photos = photoUrls.filter(url => url.trim() !== '');
    if (photos.length === 0) {
        alert('请至少添加一张照片链接');
        return;
    }

    const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [];

    const id = document.getElementById('editId').value;

    if (id) {
        // Edit existing
        const t = teachers.find(tc => tc.id === id);
        if (t) {
            t.name = name;
            t.tgHandle = tg;
            t.district = district;
            t.price = price;
            t.status = status;
            t.schedule = schedule || '-';
            t.discount = discount;
            t.bio = bio;
            t.tags = tags;
            t.photos = photos;
        }
    } else {
        // Add new
        teachers.push({
            id: 't' + Date.now(),
            name,
            tgHandle: tg,
            district,
            price,
            status,
            schedule: schedule || '-',
            discount,
            bio,
            tags,
            photos,
            reviews: []
        });
    }

    saveData();
    closeEditor();
    renderAdminTable();

    // Also update frontend tag filters if needed
    if (typeof updateTagFilters === 'function') {
        updateTagFilters();
    }
}

function toggleStatus(id) {
    const t = teachers.find(tc => tc.id === id);
    if (!t) return;
    t.status = t.status === '营业中' ? '休息中' : '营业中';
    saveData();
    renderAdminTable();
}

function deleteTeacher(id) {
    if (!confirm('确定要删除这位老师吗？此操作不可撤销！')) return;
    teachers = teachers.filter(t => t.id !== id);
    saveData();
    renderAdminTable();
}

function exportData() {
    const json = JSON.stringify(teachers, null, 2);
    document.getElementById('importData').value = json;

    // Download
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teachers-data-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

function importData() {
    const raw = document.getElementById('importData').value.trim();
    if (!raw) {
        alert('请粘贴JSON数据');
        return;
    }
    try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            alert('数据格式错误：需要一个数组');
            return;
        }
        if (!confirm('导入将覆盖当前所有数据，确定继续？')) return;
        teachers = data;
        saveData();
        renderAdminTable();
        alert('导入成功！共 ' + teachers.length + ' 位老师');
    } catch (e) {
        alert('JSON解析失败：' + e.message);
    }
}

// Init
document.addEventListener('DOMContentLoaded', initAdmin);


// ---------- 云端同步 UI 初始化 ----------
function initCloudUI() {
    // 加载已保存的配置
    var config = getCloudConfig();
    if (config) {
        document.getElementById('cloudBinId').value = config.binId || '';
        document.getElementById('cloudApiKey').value = config.apiKey || '';
        updateCloudStatus();
    }

    // 测试连接
    document.getElementById('cloudTestBtn').addEventListener('click', testCloudConnectionHandler);

    // 保存配置
    document.getElementById('cloudSaveConfigBtn').addEventListener('click', saveCloudConfigHandler);

    // 推送到云端
    document.getElementById('cloudPushBtn').addEventListener('click', pushToCloud);

    // 从云端拉取
    document.getElementById('cloudLoadBtn').addEventListener('click', loadFromCloudHandler);

    // 清除配置
    document.getElementById('cloudClearBtn').addEventListener('click', function() {
        localStorage.removeItem(CLOUD_CONFIG_KEY);
        document.getElementById('cloudBinId').value = '';
        document.getElementById('cloudApiKey').value = '';
        updateCloudStatus();
        setCloudMessage('云端配置已清除', 'var(--text-muted)');
    });
}

function updateCloudStatus() {
    var status = document.getElementById('cloudStatus');
    var config = getCloudConfig();
    if (config && config.binId) {
        status.innerHTML = '<span style="color:var(--cyan)"><i class="fas fa-check-circle"></i> 已配置</span>';
    } else {
        status.innerHTML = '<span style="color:var(--text-muted)">未配置</span>';
    }
}

function setCloudMessage(msg, color) {
    var el = document.getElementById('cloudMessage');
    el.innerHTML = msg;
    el.style.color = color || 'var(--text-muted)';
    if (color !== 'red') setTimeout(function() { el.innerHTML = ''; }, 5000);
}

// 测试连接
async function testCloudConnectionHandler() {
    var binId = document.getElementById('cloudBinId').value.trim();
    var apiKey = document.getElementById('cloudApiKey').value.trim();

    if (!binId) {
        setCloudMessage('⚠️ 请先填写 Bin ID', 'var(--orange)');
        return;
    }

    setCloudMessage('⏳ 正在测试连接...', 'var(--cyan)');
    document.getElementById('cloudTestBtn').disabled = true;

    var result = await testCloudConnection(binId, apiKey);

    document.getElementById('cloudTestBtn').disabled = false;

    if (result.ok) {
        setCloudMessage('✅ ' + result.message, 'var(--green)');
    } else {
        setCloudMessage('❌ 连接失败: ' + result.message, 'var(--accent)');
    }
}

// 保存配置
function saveCloudConfigHandler() {
    var binId = document.getElementById('cloudBinId').value.trim();
    var apiKey = document.getElementById('cloudApiKey').value.trim();

    if (!binId) {
        setCloudMessage('⚠️ 请填写 Bin ID', 'var(--orange)');
        return;
    }

    saveCloudConfig({ binId: binId, apiKey: apiKey });
    updateCloudStatus();
    setCloudMessage('✅ 配置已保存', 'var(--cyan)');
}

// 推送到云端
async function pushToCloud() {
    if (!hasCloudConfig()) {
        setCloudMessage('⚠️ 请先配置并保存 Bin ID', 'var(--orange)');
        return;
    }

    setCloudMessage('⏳ 正在推送到云端...', 'var(--cyan)');
    document.getElementById('cloudPushBtn').disabled = true;

    var ok = await saveToCloud(teachers);

    document.getElementById('cloudPushBtn').disabled = false;

    if (ok) {
        setCloudMessage('✅ 成功推送到云端！所有设备刷新后将看到最新数据', 'var(--green)');
    } else {
        setCloudMessage('❌ 推送失败，请检查 Bin ID 和 API Key', 'var(--accent)');
    }
}

// 从云端拉取
async function loadFromCloudHandler() {
    if (!hasCloudConfig()) {
        setCloudMessage('⚠️ 请先配置并保存 Bin ID', 'var(--orange)');
        return;
    }

    setCloudMessage('⏳ 正在从云端拉取...', 'var(--cyan)');
    document.getElementById('cloudLoadBtn').disabled = true;

    var cloudData = await loadFromCloud();

    document.getElementById('cloudLoadBtn').disabled = false;

    if (cloudData && cloudData.length > 0) {
        teachers = cloudData;
        saveData();
        renderAdminTable();
        setCloudMessage('✅ 从云端拉取了 ' + cloudData.length + ' 位老师数据', 'var(--green)');
    } else if (cloudData && cloudData.length === 0) {
        setCloudMessage('⚠️ 云端没有数据，请先推送', 'var(--orange)');
    } else {
        setCloudMessage('❌ 拉取失败，请检查配置', 'var(--accent)');
    }
}

// ---------- 一键上传（sm.ms 默认 / Imgur 备选）----------
function uploadToSmms(file) {
    var progress = document.getElementById('uploadProgress');
    var status = document.getElementById('uploadStatus');
    progress.style.display = 'block';
    status.innerHTML = '正在上传 ' + file.name + ' ...';

    var formData = new FormData();
    formData.append('smfile', file);

    fetch('https://sm.ms/api/v2/upload', {
        method: 'POST',
        body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.success && data.data) {
            // sm.ms 返回的直链格式: https://i.sm.ms/ + storename
            var url = data.data.url;          // 页面链接
            var directUrl = 'https://i.sm.ms/' + data.data.storename;  // 直链
            status.innerHTML = '✅ 上传成功！';
            setTimeout(function() { progress.style.display = 'none'; }, 1500);

            fillPhotoUrl(directUrl);
        } else {
            // 部分失败时 msg 可能有详情
            var errMsg = data.message || data.msg || '未知错误';
            // sm.ms 有时返回 "Image upload repeated" 说明图片已存在
            if (data.images) {
                var dupUrl = 'https://i.sm.ms/' + (data.images.split('/').pop());
                status.innerHTML = '⚠️ 图片已存在，直接使用';
                setTimeout(function() { progress.style.display = 'none'; }, 1500);
                fillPhotoUrl(dupUrl);
            } else {
                status.innerHTML = '❌ 上传失败: ' + errMsg;
                setTimeout(function() { progress.style.display = 'none'; }, 3000);
            }
        }
    })
    .catch(function(err) {
        status.innerHTML = '❌ 网络错误: ' + err.message;
        setTimeout(function() { progress.style.display = 'none'; }, 3000);
    });
}

// 自动填入照片URL
function fillPhotoUrl(url) {
    var emptyIdx = -1;
    for (var i = 0; i < photoUrls.length; i++) {
        if (!photoUrls[i] || photoUrls[i].trim() === '') {
            emptyIdx = i;
            break;
        }
    }
    if (emptyIdx >= 0) {
        photoUrls[emptyIdx] = url;
    } else {
        photoUrls.push(url);
    }
    renderPhotoInputs();
}

// 上传入口（自动选择图床）
function uploadToImgur(file) {
    // 如果有 Imgur Client ID，用 Imgur；否则用 sm.ms
    var clientId = '';
    if (typeof CLOUD_CONFIG !== 'undefined' && CLOUD_CONFIG && CLOUD_CONFIG.imgurClientId) {
        clientId = CLOUD_CONFIG.imgurClientId;
    }
    if (clientId) {
        // Imgur 上传
        var progress = document.getElementById('uploadProgress');
        var status = document.getElementById('uploadStatus');
        progress.style.display = 'block';
        status.innerHTML = '正在上传 ' + file.name + ' ...';

        var reader = new FileReader();
        reader.onload = function(e) {
            var base64 = e.target.result.split(',')[1];
            fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    'Authorization': 'Client-ID ' + clientId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: base64, type: 'base64' })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success && data.data && data.data.link) {
                    status.innerHTML = '✅ 上传成功！';
                    setTimeout(function() { progress.style.display = 'none'; }, 1500);
                    fillPhotoUrl(data.data.link);
                } else {
                    status.innerHTML = '❌ 上传失败，换 sm.ms 重试';
                    setTimeout(function() { progress.style.display = 'none'; }, 1000);
                    uploadToSmms(file); // 自动降级
                }
            })
            .catch(function() {
                status.innerHTML = '⚠️ Imgur 失败，切到 sm.ms...';
                uploadToSmms(file);
            });
        };
        reader.onerror = function() {
            status.innerHTML = '❌ 读取文件失败';
        };
        reader.readAsDataURL(file);
    } else {
        uploadToSmms(file);
    }
}
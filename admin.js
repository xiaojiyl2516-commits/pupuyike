// ============================================================
// 浦浦荐逼 - 管理后台逻辑
// ============================================================

var editingId = null;
var photoUrls = [''];

function initAdmin() {
    loadData();
    renderAdminTable();

    document.getElementById('addTeacherBtn').addEventListener('click', function() { openEditor(null); });
    document.getElementById('editorSave').addEventListener('click', saveTeacher);
    document.getElementById('editorCancel').addEventListener('click', closeEditor);

    // 照片管理
    document.getElementById('addPhotoBtn').addEventListener('click', function() {
        photoUrls.push('');
        renderPhotoInputs();
    });

    // Imgur上传（实际是本地base64）
    document.getElementById('imgurFileInput').addEventListener('change', function(e) {
        if (this.files && this.files[0]) uploadToImgur(this.files[0]);
        this.value = '';
    });
    document.getElementById('uploadNewBtn').addEventListener('click', function() {
        document.getElementById('imgurFileInput').click();
    });

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);

    // 云端同步
    initCloudUI();
}

function renderAdminTable() {
    var countLabel = document.getElementById('dataCountLabel');
    if (countLabel) {
        countLabel.innerHTML = '当前 localStorage 中存储了 <strong style="color:#fff">' + teachers.length + '</strong> 位老师数据';
    }
    var tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = teachers.map(function(t) {
        return '<tr>' +
            '<td><strong style="color:#fff">' + t.name + '</strong></td>' +
            '<td style="color:var(--cyan)">@' + t.tgHandle + '</td>' +
            '<td>' + t.district + '</td>' +
            '<td style="color:var(--accent);font-weight:700">¥' + t.price + '</td>' +
            '<td><div class="tag-pills">' + t.tags.map(function(tag) { return '<span class="tag-pill">' + tag + '</span>'; }).join('') + '</div></td>' +
            '<td><span class="status-badge ' + (t.status === '营业中' ? 'online' : 'offline') + '">' + t.status + '</span></td>' +
            '<td>' + t.photos.length + ' 张</td>' +
            '<td>' +
                '<button class="action-btn edit" data-id="' + t.id + '" title="编辑"><i class="fas fa-edit"></i></button> ' +
                '<button class="action-btn toggle" data-id="' + t.id + '" title="切换状态"><i class="fas fa-sync-alt"></i></button> ' +
                '<button class="action-btn delete" data-id="' + t.id + '" title="删除"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');

    tbody.querySelectorAll('.action-btn.edit').forEach(function(btn) {
        btn.addEventListener('click', function() { openEditor(this.dataset.id); });
    });
    tbody.querySelectorAll('.action-btn.toggle').forEach(function(btn) {
        btn.addEventListener('click', function() { toggleStatus(this.dataset.id); });
    });
    tbody.querySelectorAll('.action-btn.delete').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTeacher(this.dataset.id); });
    });
}

function openEditor(id) {
    editingId = id;
    var t = id ? teachers.find(function(tc) { return tc.id === id; }) : null;

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
        photoUrls = t.photos.slice();
    } else {
        ['editName','editTG','editPrice','editSchedule','editDiscount','editBio','editTags'].forEach(function(f) {
            document.getElementById(f).value = '';
        });
        document.getElementById('editDistrict').value = '锦江区';
        document.getElementById('editStatus').value = '营业中';
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
    var container = document.getElementById('photoList');
    container.innerHTML = photoUrls.map(function(url, i) {
        var isBase64 = url && url.startsWith('data:');
        var preview = url ? (isBase64 ? '<img src="' + url + '" style="width:32px;height:32px;border-radius:4px;object-fit:cover"> ' : '<i class="fas fa-link" style="color:var(--cyan);font-size:12px"></i> ') : '';
        return '<div class="photo-input-group">' +
            preview +
            '<input type="text" class="photo-input" value="' + url + '" placeholder="照片URL ' + (i+1) + '" data-idx="' + i + '">' +
            (photoUrls.length > 1 ? '<button class="remove-photo-btn" data-idx="' + i + '"><i class="fas fa-times"></i></button>' : '') +
            '</div>';
    }).join('');

    container.querySelectorAll('.photo-input').forEach(function(inp) {
        inp.addEventListener('input', function() {
            photoUrls[parseInt(this.dataset.idx)] = this.value;
        });
    });
    container.querySelectorAll('.remove-photo-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(this.dataset.idx);
            photoUrls.splice(idx, 1);
            if (photoUrls.length === 0) photoUrls = [''];
            renderPhotoInputs();
        });
    });
}

function saveTeacher() {
    var name = document.getElementById('editName').value.trim();
    var tg = document.getElementById('editTG').value.trim();
    var district = document.getElementById('editDistrict').value;
    var price = parseInt(document.getElementById('editPrice').value);
    var status = document.getElementById('editStatus').value;
    var schedule = document.getElementById('editSchedule').value.trim();
    var discount = document.getElementById('editDiscount').value.trim();
    var bio = document.getElementById('editBio').value.trim();
    var tagsRaw = document.getElementById('editTags').value.trim();

    if (!name || !tg || !price) {
        alert('请填写花名、TG账号和价格（必填项）');
        return;
    }

    var photos = photoUrls.filter(function(url) { return url.trim() !== ''; });
    if (photos.length === 0) {
        alert('请至少添加一张照片');
        return;
    }

    var tags = tagsRaw ? tagsRaw.split(/[,，]/).map(function(s) { return s.trim(); }).filter(Boolean) : [];
    var id = document.getElementById('editId').value;

    if (id) {
        var t = teachers.find(function(tc) { return tc.id === id; });
        if (t) {
            t.name = name; t.tgHandle = tg; t.district = district;
            t.price = price; t.status = status; t.schedule = schedule || '-';
            t.discount = discount; t.bio = bio; t.tags = tags; t.photos = photos;
        }
    } else {
        teachers.push({
            id: 't' + Date.now(), name: name, tgHandle: tg, district: district,
            price: price, status: status, schedule: schedule || '-',
            discount: discount, bio: bio, tags: tags, photos: photos, reviews: []
        });
    }

    saveData();
    closeEditor();
    renderAdminTable();
}

function toggleStatus(id) {
    var t = teachers.find(function(tc) { return tc.id === id; });
    if (!t) return;
    t.status = t.status === '营业中' ? '休息中' : '营业中';
    saveData();
    renderAdminTable();
}

function deleteTeacher(id) {
    if (!confirm('确定要删除这位老师吗？此操作不可撤销！')) return;
    teachers = teachers.filter(function(t) { return t.id !== id; });
    saveData();
    renderAdminTable();
}

function exportData() {
    var json = JSON.stringify(teachers, null, 2);
    document.getElementById('importData').value = json;
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teachers-data-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

function importData() {
    var raw = document.getElementById('importData').value.trim();
    if (!raw) { alert('请粘贴JSON数据'); return; }
    try {
        var data = JSON.parse(raw);
        if (!Array.isArray(data)) { alert('数据格式错误：需要一个数组'); return; }
        if (!confirm('导入将覆盖当前所有数据，确定继续？')) return;
        teachers = data;
        saveData();
        renderAdminTable();
        alert('导入成功！共 ' + teachers.length + ' 位老师');
    } catch(e) {
        alert('JSON解析失败：' + e.message);
    }
}

// ===== 云端同步 =====
function initCloudUI() {
    var config = getCloudConfig();
    if (config) {
        document.getElementById('cloudBinId').value = config.binId || '';
        document.getElementById('cloudApiKey').value = config.apiKey || '';
        updateCloudStatus();
    }
    document.getElementById('cloudTestBtn').addEventListener('click', testCloudConnectionHandler);
    document.getElementById('cloudSaveConfigBtn').addEventListener('click', saveCloudConfigHandler);
    document.getElementById('cloudPushBtn').addEventListener('click', pushToCloud);
    document.getElementById('cloudLoadBtn').addEventListener('click', loadFromCloudHandler);
    document.getElementById('cloudClearBtn').addEventListener('click', function() {
        localStorage.removeItem('ppjb_cloud_config');
        document.getElementById('cloudBinId').value = '';
        document.getElementById('cloudApiKey').value = '';
        updateCloudStatus();
        setCloudMessage('云端配置已清除', 'var(--text-muted)');
    });
}

function updateCloudStatus() {
    var el = document.getElementById('cloudStatus');
    var config = getCloudConfig();
    el.innerHTML = config && config.binId
        ? '<span style="color:var(--cyan)"><i class="fas fa-check-circle"></i> 已配置</span>'
        : '<span style="color:var(--text-muted)">未配置</span>';
}

function setCloudMessage(msg, color) {
    var el = document.getElementById('cloudMessage');
    el.innerHTML = msg;
    el.style.color = color || 'var(--text-muted)';
    if (color !== 'red') setTimeout(function() { el.innerHTML = ''; }, 5000);
}

async function testCloudConnectionHandler() {
    var binId = document.getElementById('cloudBinId').value.trim();
    var apiKey = document.getElementById('cloudApiKey').value.trim();
    if (!binId) { setCloudMessage('⚠️ 请先填写 Bin ID', 'var(--orange)'); return; }
    setCloudMessage('⏳ 正在测试连接...', 'var(--cyan)');
    document.getElementById('cloudTestBtn').disabled = true;
    var result = await testCloudConnection(binId, apiKey);
    document.getElementById('cloudTestBtn').disabled = false;
    setCloudMessage(result.ok ? '✅ ' + result.message : '❌ 连接失败: ' + result.message, result.ok ? 'var(--green)' : 'var(--accent)');
}

function saveCloudConfigHandler() {
    var binId = document.getElementById('cloudBinId').value.trim();
    var apiKey = document.getElementById('cloudApiKey').value.trim();
    if (!binId) { setCloudMessage('⚠️ 请填写 Bin ID', 'var(--orange)'); return; }
    saveCloudConfig({ binId: binId, apiKey: apiKey });
    updateCloudStatus();
    setCloudMessage('✅ 配置已保存', 'var(--cyan)');
}

async function pushToCloud() {
    if (!hasCloudConfig()) { setCloudMessage('⚠️ 请先配置并保存 Bin ID', 'var(--orange)'); return; }
    setCloudMessage('⏳ 正在推送到云端...', 'var(--cyan)');
    document.getElementById('cloudPushBtn').disabled = true;
    var ok = await saveToCloud(teachers);
    document.getElementById('cloudPushBtn').disabled = false;
    setCloudMessage(ok ? '✅ 推送成功！所有设备刷新后将看到最新数据' : '❌ 推送失败', ok ? 'var(--green)' : 'var(--accent)');
}

async function loadFromCloudHandler() {
    if (!hasCloudConfig()) { setCloudMessage('⚠️ 请先配置并保存 Bin ID', 'var(--orange)'); return; }
    setCloudMessage('⏳ 正在从云端拉取...', 'var(--cyan)');
    document.getElementById('cloudLoadBtn').disabled = true;
    var cloudData = await loadFromCloud();
    document.getElementById('cloudLoadBtn').disabled = false;
    if (cloudData && cloudData.length > 0) {
        teachers = cloudData; saveData(); renderAdminTable();
        setCloudMessage('✅ 拉取了 ' + cloudData.length + ' 位老师', 'var(--green)');
    } else if (cloudData && cloudData.length === 0) {
        setCloudMessage('⚠️ 云端无数据', 'var(--orange)');
    } else {
        setCloudMessage('❌ 拉取失败', 'var(--accent)');
    }
}

// ---------- 本地转 base64 存储（无需图床）----------
function uploadToImgur(file) {
    var progress = document.getElementById('uploadProgress');
    var status = document.getElementById('uploadStatus');
    progress.style.display = 'block';
    status.innerHTML = '正在处理 ' + file.name + ' ...';

    if (file.size > 2 * 1024 * 1024) {
        status.innerHTML = '⚠️ 图片超过 2MB，请压缩后再上传';
        setTimeout(function() { progress.style.display = 'none'; }, 3000);
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var dataUrl = e.target.result;
        var kb = Math.round(dataUrl.length / 1024);
        status.innerHTML = '✅ 添加成功！(' + kb + 'KB)';
        setTimeout(function() { progress.style.display = 'none'; }, 1500);
        fillPhotoUrl(dataUrl);
    };
    reader.onerror = function() {
        status.innerHTML = '❌ 读取文件失败';
        setTimeout(function() { progress.style.display = 'none'; }, 3000);
    };
    reader.readAsDataURL(file);
}

function fillPhotoUrl(url) {
    var emptyIdx = -1;
    for (var i = 0; i < photoUrls.length; i++) {
        if (!photoUrls[i] || photoUrls[i].trim() === '') {
            emptyIdx = i; break;
        }
    }
    if (emptyIdx >= 0) {
        photoUrls[emptyIdx] = url;
    } else {
        photoUrls.push(url);
    }
    renderPhotoInputs();
}

document.addEventListener('DOMContentLoaded', initAdmin);

// ============================================================
// 蓉城·名媛 - 管理后台逻辑
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

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Import
    document.getElementById('importBtn').addEventListener('click', importData);
}

function renderAdminTable() {
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

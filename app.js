// ============================================================
// 浦浦荐逼 - 主逻辑
// ============================================================

// ---------- Telegram WebApp ----------
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// ---------- 全局变量 ----------
// 不再有预设老师！所有数据来自云端或localStorage
var DEFAULT_TEACHERS = [];

var teachers = [], currentFilter = 'all', currentTagFilter = 'all', currentTeacherId = null;
var currentPhotoIdx = 0, currentRating = 0, photoUrls = [''], editingId = null;

// ---------- 数据管理 ----------
async function loadData() {
    // 尝试从云端加载（优先）
    var cloudOk = false;
    if (typeof hasCloudConfig === 'function' && hasCloudConfig()) {
        try {
            var cd = await loadFromCloud();
            if (cd && cd.length > 0) {
                teachers = cd;
                saveData();
                cloudOk = true;
            }
        } catch(e) { console.warn('cloud load failed', e); }
    }
    if (cloudOk) return;
    // 云端无数据，降级到 localStorage
    try {
        var saved = localStorage.getItem('cd_data');
        if (saved) {
            teachers = JSON.parse(saved);
            return;
        }
    } catch(e) {}
    teachers = [];
    saveData();
}

function saveData() {
    localStorage.setItem('cd_data', JSON.stringify(teachers));
}

async function tryLoadCloud() {
    if (typeof hasCloudConfig !== 'function' || !hasCloudConfig()) return;
    try {
        var cd = await loadFromCloud();
        if (cd && cd.length > 0) {
            teachers = cd;
            saveData();
            applyFilters();
            updateTagFilters();
        }
    } catch(e) { console.warn('cloud load failed', e); }
}

async function pushCloud() {
    if (typeof hasCloudConfig !== 'function' || !hasCloudConfig()) { showMsg('⚠️ 云端未配置'); return; }
    showMsg('⏳ 推送中...');
    CLOUD_LAST_ERROR = '';
    var ok = await saveToCloud(teachers);
    if (ok) {
        showMsg('✅ 推送成功');
    } else {
        var err = typeof getLastError === 'function' ? getLastError() : '';
        showMsg('❌ 推送失败' + (err ? ': ' + err : ''));
    }
}

async function pullCloud() {
    if (typeof hasCloudConfig !== 'function' || !hasCloudConfig()) { showMsg('⚠️ 云端未配置'); return; }
    showMsg('⏳ 拉取中...');
    CLOUD_LAST_ERROR = '';
    var cd = await loadFromCloud();
    if (cd && cd.length > 0) {
        teachers = cd; saveData(); applyFilters(); updateTagFilters();
        var tbl = document.getElementById('adminTableBody');
        if (tbl) renderAdminTable();
        showMsg('✅ 拉取 ' + cd.length + ' 位老师');
    } else {
        var err = typeof getLastError === 'function' ? getLastError() : '';
        showMsg('❌ 拉取失败' + (err ? ': ' + err : ''));
    }
}

function testProxy() {
    if (typeof testProxyConnection !== 'function') { showMsg('❌ cloud.js 未加载'); return; }
    testProxyConnection().then(function(r) {
        showMsg(r.ok ? '✅ ' + r.msg : '❌ ' + r.msg);
    });
}

function showMsg(text) {
    var el = document.getElementById('cloudMsg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    if (!text.includes('❌') && !text.includes('⚠️')) {
        setTimeout(function() { el.style.display = 'none'; }, 3000);
    }
}

// ========== 前台渲染 ==========
function renderCards(list) {
    var grid = document.getElementById('cardGrid');
    var ct = document.getElementById('teacherCount');
    var badge = document.getElementById('totalBadge');
    if (!grid) return;
    ct.textContent = list.length;
    badge.textContent = list.length;
    if (list.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-search" style="font-size:28px;display:block;margin-bottom:8px"></i>没有匹配的老师</div>';
        return;
    }
    grid.innerHTML = list.map(function(t) {
        var avg = t.reviews.length ? (t.reviews.reduce(function(s,r){return s+r.rating},0)/t.reviews.length).toFixed(1) : 0;
        var mainPhoto = t.photos && t.photos.length > 0 ? t.photos[0] : '';
        var photoCount = t.photos ? t.photos.length : 0;
        var statusClass = t.status === '营业中' ? 'online' : 'offline';
        var tags = t.tags && t.tags.length ? t.tags.slice(0,3).map(function(tag){return '<span class="card-tag">'+tag+'</span>'}).join('') : '';
        return '<div class="teacher-card" data-id="'+t.id+'" onclick="openDetail(\''+t.id+'\')">' +
            (mainPhoto ? '<div class="card-photo"><img src="'+mainPhoto+'" alt="'+t.name+'" loading="lazy" onerror="this.style.display=\'none\'"><div class="card-photo-count"><i class="fas fa-image"></i> '+photoCount+'</div></div>' : '<div class="card-photo" style="background:var(--bg-card);display:flex;align-items:center;justify-content:center"><i class="fas fa-user" style="font-size:32px;color:var(--text-muted)"></i></div>') +
            '<div class="card-overlay"><div class="card-body"><div class="card-header"><h3 class="card-name">'+t.name+'</h3><span class="card-status '+statusClass+'">'+t.status+'</span></div>' +
            (t.tgHandle ? '<div class="card-tg"><i class="fab fa-telegram-plane"></i> @'+t.tgHandle+'</div>' : '') +
            (tags ? '<div class="card-tags">'+tags+'</div>' : '') +
            '<div class="card-meta"><span class="card-district"><i class="fas fa-map-marker-alt"></i> '+t.district+'</span><span class="card-price">¥'+t.price+'</span></div>' +
            (t.reviews.length ? '<div class="card-rating"><i class="fas fa-star" style="color:var(--gold)"></i> '+avg+' ('+t.reviews.length+')</div>' : '') +
            '</div></div></div>';
    }).join('');
}

// ========== 筛选 ==========
function applyFilters() {
    var list = teachers.filter(function(t) {
        if (currentFilter !== 'all' && t.district !== currentFilter) return false;
        if (currentTagFilter !== 'all' && (!t.tags || t.tags.indexOf(currentTagFilter) === -1)) return false;
        var q = (document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim().toLowerCase() : '');
        if (q) {
            var match = t.name.toLowerCase().indexOf(q) > -1 ||
                (t.tgHandle && t.tgHandle.toLowerCase().indexOf(q) > -1) ||
                (t.tags && t.tags.some(function(tag){return tag.toLowerCase().indexOf(q) > -1})) ||
                (t.bio && t.bio.toLowerCase().indexOf(q) > -1);
            if (!match) return false;
        }
        var min = document.getElementById('priceMin') ? parseInt(document.getElementById('priceMin').value) || 0 : 0;
        var max = document.getElementById('priceMax') ? parseInt(document.getElementById('priceMax').value) || 0 : 0;
        if (min > 0 && t.price < min) return false;
        if (max > 0 && t.price > max) return false;
        var statusRadio = document.querySelector('input[name="status"]:checked');
        if (statusRadio && statusRadio.value !== 'all' && t.status !== statusRadio.value) return false;
        return true;
    });
    renderCards(list);
    updateTagFilters();
}

function updateTagFilters() {
    var container = document.getElementById('tagFilters');
    if (!container) return;
    var tagSet = {};
    teachers.forEach(function(t) {
        if (t.tags) t.tags.forEach(function(tag) { tagSet[tag] = (tagSet[tag] || 0) + 1; });
    });
    var tags = Object.keys(tagSet).sort();
    container.innerHTML = '<span class="filter-tag '+(currentTagFilter==='all'?'active':'')+'" data-tag="all">全部</span>' +
        tags.map(function(tag) {
            return '<span class="filter-tag '+(currentTagFilter===tag?'active':'')+'" data-tag="'+tag+'">'+tag+' <small>'+tagSet[tag]+'</small></span>';
        }).join('');
    container.querySelectorAll('.filter-tag').forEach(function(el) {
        el.addEventListener('click', function() {
            currentTagFilter = this.dataset.tag;
            container.querySelectorAll('.filter-tag').forEach(function(x){x.classList.remove('active')});
            this.classList.add('active');
            applyFilters();
        });
    });
}

// ========== 老师详情 ==========
function openDetail(id) {
    var t = teachers.find(function(tc) { return tc.id === id; });
    if (!t) return;
    currentTeacherId = id;
    currentPhotoIdx = 0;
    document.getElementById('modalName').textContent = t.name;
    document.getElementById('modalTG').textContent = t.tgHandle || '未设置';
    document.getElementById('modalDistrict').textContent = t.district;
    document.getElementById('modalPrice').textContent = '¥' + t.price;
    document.getElementById('modalSchedule').textContent = t.schedule || '未设置';
    document.getElementById('modalDiscount').textContent = t.discount || '暂无';
    document.getElementById('modalBio').textContent = t.bio || '暂无简介';
    var statusEl = document.getElementById('modalStatus');
    statusEl.textContent = t.status;
    statusEl.className = 'modal-status ' + (t.status === '营业中' ? 'online' : 'offline');
    var tagsEl = document.getElementById('modalTags');
    tagsEl.innerHTML = (t.tags || []).map(function(tag) { return '<span class="modal-tag">'+tag+'</span>'; }).join('');
    renderPhotos(t);
    renderReviews(t.reviews);
    document.getElementById('teacherModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function renderPhotos(t) {
    var img = document.getElementById('galleryImg');
    var counter = document.getElementById('galleryCounter');
    var thumbs = document.getElementById('galleryThumbs');
    var photos = t.photos && t.photos.length > 0 ? t.photos : [];
    if (photos.length === 0) {
        img.src = '';
        img.alt = '暂无照片';
        img.style.display = 'none';
        counter.textContent = '0/0';
        thumbs.innerHTML = '';
        return;
    }
    img.style.display = 'block';
    img.src = photos[currentPhotoIdx];
    img.alt = t.name + ' ' + (currentPhotoIdx + 1);
    img.onerror = function() { this.src = ''; this.alt = '加载失败'; };
    counter.textContent = (currentPhotoIdx + 1) + '/' + photos.length;
    thumbs.innerHTML = photos.map(function(url, idx) {
        return '<div class="gallery-thumb '+(idx===currentPhotoIdx?'active':'')+'" onclick="jumpToPhoto('+idx+')"><img src="'+url+'" alt="" onerror="this.style.display=\'none\'"></div>';
    }).join('');
}

function navGallery(dir) {
    var t = teachers.find(function(tc) { return tc.id === currentTeacherId; });
    if (!t || !t.photos || t.photos.length === 0) return;
    currentPhotoIdx = (currentPhotoIdx + dir + t.photos.length) % t.photos.length;
    renderPhotos(t);
}

function jumpToPhoto(idx) {
    var t = teachers.find(function(tc) { return tc.id === currentTeacherId; });
    if (!t || !t.photos || idx < 0 || idx >= t.photos.length) return;
    currentPhotoIdx = idx;
    renderPhotos(t);
}

// ========== 评价 ==========
function renderReviews(reviews) {
    var el = document.getElementById('reviewsList');
    if (!el) return;
    if (!reviews || reviews.length === 0) {
        el.innerHTML = '<div class="no-reviews"><i class="fas fa-comment-dots" style="font-size:20px;display:block;margin:0 auto 8px;color:var(--text-muted)"></i>暂无评价，快来写下第一条吧</div>';
        return;
    }
    el.innerHTML = reviews.map(function(r) {
        var stars = '';
        for (var i = 0; i < 5; i++) stars += (i < r.rating ? '★' : '☆');
        return '<div class="review-item"><div class="review-meta"><span class="review-author">'+r.author+'</span><span class="review-stars">'+stars+'</span></div><div class="review-text">'+r.text+'</div></div>';
    }).reverse().join('');
}

// ========== 签到 ==========
var CHECKIN_KEY = 'ppjb_checkin_wolf';

function initCheckin() {
    var btn = document.getElementById('checkinBtn');
    if (!btn) return;
    btn.addEventListener('click', function() { document.getElementById('checkinModal').classList.add('open'); });
    document.getElementById('chkClose').addEventListener('click', function() { document.getElementById('checkinModal').classList.remove('open'); });

    document.getElementById('chkWolf').addEventListener('click', function() {
        var today = new Date().toISOString().slice(0,10);
        var chk = JSON.parse(localStorage.getItem(CHECKIN_KEY) || '{}');
        if (chk[today]) {
            document.getElementById('wolfMsg').textContent = '今天已经签到过了，明天再来吧！';
        } else {
            chk[today] = true;
            chk.total = (chk.total || 0) + 1;
            localStorage.setItem(CHECKIN_KEY, JSON.stringify(chk));
            document.getElementById('wolfMsg').textContent = '+1 积分，累计 '+chk.total+' 天';
        }
        document.getElementById('wolfPts').textContent = (chk.total || 0) + ' 分';
        document.getElementById('chkWolfRes').style.display = 'block';
    });

    document.getElementById('chkWolfDone').addEventListener('click', function() { document.getElementById('checkinModal').classList.remove('open'); });

    document.getElementById('chkTeacher').addEventListener('click', function() {
        var list = document.getElementById('chkTeacherList');
        list.innerHTML = teachers.map(function(t) {
            var st = t.status === '营业中' ? '🟢 营业中' : '🔴 休息中';
            return '<div class="chk-teacher-item" data-id="'+t.id+'" style="padding:8px 12px;margin:4px 0;background:rgba(124,77,255,0.06);border-radius:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer"><span>'+t.name+' ('+st+')</span><span style="font-size:11px;color:var(--cyan)">点我签到</span></div>';
        }).join('');
        list.querySelectorAll('.chk-teacher-item').forEach(function(el) {
            el.addEventListener('click', function() {
                var id = this.dataset.id;
                var t = teachers.find(function(tc) { return tc.id === id; });
                if (!t) return;
                t.status = t.status === '营业中' ? '休息中' : '营业中';
                if (t.status === '营业中') t.schedule = '已签到 ' + new Date().toLocaleString('zh-CN', {hour:'2-digit',minute:'2-digit'});
                saveData();
                document.getElementById('chkTeacherMsg').textContent = t.name + ' 已切换为「' + t.status + '」';
                document.getElementById('chkTeacherRes').style.display = 'none';
                document.getElementById('chkTeacherDoneRes').style.display = 'block';
                applyFilters();
            });
        });
        document.getElementById('chkTeacherRes').style.display = 'block';
    });
    document.getElementById('chkTeacherBack').addEventListener('click', function() { document.getElementById('chkTeacherRes').style.display = 'none'; });
    document.getElementById('chkTeacherDone').addEventListener('click', function() { document.getElementById('checkinModal').classList.remove('open'); document.getElementById('chkTeacherDoneRes').style.display = 'none'; });
}

// ========== 管理员表格渲染 ==========
function renderAdminTable() {
    var tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">暂无老师数据，点击「添加老师」</td></tr>';
        return;
    }
    tbody.innerHTML = teachers.map(function(t) {
        var st = t.status === '营业中' ? '🟢' : '🔴';
        return '<tr><td>'+t.name+'</td><td>@'+(t.tgHandle||'-')+'</td><td>'+t.district+'</td><td>¥'+t.price+'</td><td>'+st+' '+t.status+'</td><td>'+(t.photos?t.photos.length:0)+'张</td><td class="admin-actions"><button class="admin-btn edit" onclick="openEditor(\''+t.id+'\')"><i class="fas fa-edit"></i> 编辑</button><button class="admin-btn toggle" onclick="toggleStatus(\''+t.id+'\')"><i class="fas fa-sync-alt"></i></button><button class="admin-btn delete" onclick="deleteTeacher(\''+t.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }).join('');
}

function toggleStatus(id) {
    var t = teachers.find(function(tc) { return tc.id === id; });
    if (!t) return;
    t.status = t.status === '营业中' ? '休息中' : '营业中';
    saveData();
    renderAdminTable();
}

function deleteTeacher(id) {
    if (!confirm('确定删除？')) return;
    teachers = teachers.filter(function(t) { return t.id !== id; });
    saveData();
    renderAdminTable();
}

// ========== 编辑器 ==========
function openEditor(id) {
    editingId = id;
    photoUrls = [''];
    if (id) {
        var t = teachers.find(function(tc) { return tc.id === id; });
        if (!t) return;
        document.getElementById('editorTitle').textContent = '编辑老师';
        document.getElementById('teacherName').value = t.name || '';
        document.getElementById('teacherTG').value = t.tgHandle || '';
        document.getElementById('teacherDistrict').value = t.district || '';
        document.getElementById('teacherPrice').value = t.price || '';
        document.getElementById('teacherStatus').value = t.status || '营业中';
        document.getElementById('teacherSchedule').value = t.schedule || '';
        document.getElementById('teacherDiscount').value = t.discount || '';
        document.getElementById('teacherBio').value = t.bio || '';
        document.getElementById('teacherTags').value = (t.tags || []).join(', ');
        photoUrls = t.photos && t.photos.length > 0 ? t.photos.slice() : [''];
    } else {
        document.getElementById('editorTitle').textContent = '添加老师';
        document.getElementById('teacherName').value = '';
        document.getElementById('teacherTG').value = '';
        document.getElementById('teacherDistrict').value = '锦江区';
        document.getElementById('teacherPrice').value = '';
        document.getElementById('teacherStatus').value = '营业中';
        document.getElementById('teacherSchedule').value = '';
        document.getElementById('teacherDiscount').value = '';
        document.getElementById('teacherBio').value = '';
        document.getElementById('teacherTags').value = '';
    }
    renderPhotoInputs();
    document.getElementById('editorModal').classList.add('open');
}

function renderPhotoInputs() {
    var container = document.getElementById('photoUrlsContainer');
    if (!container) return;
    container.innerHTML = photoUrls.map(function(url, idx) {
        return '<div class="photo-url-row" data-idx="'+idx+'"><input type="text" class="photo-url-input" value="'+url+'" placeholder="图片网址 '+(idx+1)+'"><button class="photo-remove-btn" onclick="removePhotoUrl('+idx+')"><i class="fas fa-times"></i></button></div>';
    }).join('');
    container.querySelectorAll('.photo-url-input').forEach(function(input, idx) {
        input.addEventListener('input', function() { photoUrls[idx] = this.value; });
    });
}

function removePhotoUrl(idx) {
    photoUrls.splice(idx, 1);
    if (photoUrls.length === 0) photoUrls = [''];
    renderPhotoInputs();
}

function addPhotoUrl() {
    photoUrls.push('');
    renderPhotoInputs();
}

function saveTeacher() {
    var name = document.getElementById('teacherName').value.trim();
    if (!name) { alert('请填写老师姓名'); return; }
    var tags = document.getElementById('teacherTags').value.split(',').map(function(s){return s.trim()}).filter(Boolean);
    var urls = photoUrls.filter(function(u){return u.trim() !== ''});
    var obj = {
        id: editingId || 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        name: name,
        tgHandle: document.getElementById('teacherTG').value.trim(),
        photos: urls,
        tags: tags,
        district: document.getElementById('teacherDistrict').value,
        price: parseInt(document.getElementById('teacherPrice').value) || 0,
        status: document.getElementById('teacherStatus').value,
        schedule: document.getElementById('teacherSchedule').value,
        discount: document.getElementById('teacherDiscount').value,
        bio: document.getElementById('teacherBio').value,
        reviews: []
    };
    if (editingId) {
        var existing = teachers.find(function(t) { return t.id === editingId; });
        if (existing) {
            obj.reviews = existing.reviews || [];
            var idx = teachers.findIndex(function(t) { return t.id === editingId; });
            teachers[idx] = obj;
        }
    } else {
        teachers.push(obj);
    }
    saveData();
    document.getElementById('editorModal').classList.remove('open');
    renderAdminTable();
    applyFilters();
    updateTagFilters();
}

// ========== 导出/导入 ==========
function exportData() {
    var json = JSON.stringify(teachers, null, 2);
    var blob = new Blob([json], {type: 'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pupujianbi_data_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
}

function importData() {
    var json = prompt('粘贴 JSON 数据：');
    if (!json) return;
    try {
        var data = JSON.parse(json);
        if (!Array.isArray(data)) { alert('数据格式错误：需要数组'); return; }
        teachers = data;
        saveData();
        renderAdminTable();
        applyFilters();
        updateTagFilters();
        alert('✅ 成功导入 ' + data.length + ' 位老师');
    } catch(e) {
        alert('❌ JSON 解析失败: ' + e.message);
    }
}

// ========== 本地上传(压缩后转base64) ==========
function uploadPic() {
    var file = document.getElementById('picInput').files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            // 压缩到最大宽度200px，保持比例
            var maxW = 200, maxH = 250;
            var w = img.width, h = img.height;
            if (w > maxW) { h = h * maxW / w; w = maxW; }
            if (h > maxH) { w = w * maxH / h; h = maxH; }
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var compressed = canvas.toDataURL('image/jpeg', 0.5);
            photoUrls.push(compressed);
            renderPhotoInputs();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    document.getElementById('picInput').value = '';
}

// ========== 触屏滑动 ==========
var touchStartX = 0, touchEndX = 0;
document.addEventListener('touchstart', function(e) {
    if (!document.getElementById('teacherModal').classList.contains('open')) return;
    var gallery = document.getElementById('galleryMain');
    if (!gallery.contains(e.target)) return;
    touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener('touchend', function(e) {
    if (!document.getElementById('teacherModal').classList.contains('open')) return;
    var gallery = document.getElementById('galleryMain');
    if (!gallery.contains(e.target)) return;
    touchEndX = e.changedTouches[0].screenX;
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        navGallery(diff > 0 ? 1 : -1);
    }
});

// ============================================================
// INIT - 自动检测前/后台模式
// ============================================================
async function init() {
    var isFrontend = !!document.getElementById('cardGrid');
    var isAdmin = !!document.getElementById('adminBody');
    await loadData();

    if (isFrontend) {
        // 导航筛选
        document.querySelectorAll('.nav-link').forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(function(x){x.classList.remove('active')});
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                applyFilters();
            });
        });
        document.getElementById('searchToggle').addEventListener('click', function() {
            document.getElementById('searchBar').classList.toggle('open');
        });
        document.getElementById('searchClose').addEventListener('click', function() {
            document.getElementById('searchBar').classList.remove('open');
            document.getElementById('searchInput').value = '';
            applyFilters();
        });
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('filterToggle').addEventListener('click', function() {
            document.getElementById('filterPanel').classList.toggle('open');
        });
        document.getElementById('priceFilterBtn').addEventListener('click', applyFilters);
        document.querySelectorAll('input[name="status"]').forEach(function(r) {
            r.addEventListener('change', applyFilters);
        });
        window.addEventListener('scroll', function() {
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
        });

        // 老师详情
        document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('teacherModal').classList.remove('open'); document.body.style.overflow = ''; });
        document.getElementById('teacherModal').addEventListener('click', function(e) { if (e.target === this) { this.classList.remove('open'); document.body.style.overflow = ''; }});
        document.getElementById('galleryPrev').addEventListener('click', function() { navGallery(-1); });
        document.getElementById('galleryNext').addEventListener('click', function() { navGallery(1); });
        document.addEventListener('keydown', function(e) {
            if (!document.getElementById('teacherModal').classList.contains('open')) return;
            if (e.key === 'ArrowLeft') navGallery(-1);
            if (e.key === 'ArrowRight') navGallery(1);
            if (e.key === 'Escape') { document.getElementById('teacherModal').classList.remove('open'); document.body.style.overflow = ''; }
        });

        // 评价
        document.getElementById('addReviewBtn').addEventListener('click', function() { document.getElementById('reviewModal').classList.add('open'); });
        document.getElementById('reviewCancel').addEventListener('click', function() { document.getElementById('reviewModal').classList.remove('open'); });
        document.getElementById('reviewSubmit').addEventListener('click', function() {
            if (!currentTeacherId || !currentRating) { alert('请先评分'); return; }
            var txt = document.getElementById('reviewText').value.trim();
            if (!txt) { alert('请填写评价'); return; }
            var name = document.getElementById('reviewerName').value.trim() || '匿名';
            var t = teachers.find(function(tc) { return tc.id === currentTeacherId; });
            if (!t) return;
            t.reviews.push({author: name, rating: currentRating, text: txt, date: new Date().toISOString().slice(0,10)});
            saveData();
            currentRating = 0;
            document.getElementById('reviewText').value = '';
            document.getElementById('reviewerName').value = '';
            document.querySelectorAll('.star').forEach(function(s) { s.classList.remove('active'); });
            document.getElementById('ratingText').textContent = '点击评分';
            renderReviews(t.reviews);
            applyFilters();
            document.getElementById('reviewModal').classList.remove('open');
        });
        document.querySelectorAll('.star').forEach(function(s) {
            s.addEventListener('click', function() {
                currentRating = parseInt(this.dataset.val);
                document.querySelectorAll('.star').forEach(function(x) { x.classList.toggle('active', parseInt(x.dataset.val) <= currentRating); });
                var labels = ['', '差', '一般', '不错', '很好', '完美'];
                document.getElementById('ratingText').textContent = labels[currentRating];
            });
        });

        // 签到
        initCheckin();

        // 渲染
        updateTagFilters();
        applyFilters();
    }

    if (isAdmin) {
        renderAdminTable();
        document.getElementById('addBtn').addEventListener('click', function() { openEditor(null); });
        document.getElementById('editorSave').addEventListener('click', saveTeacher);
        document.getElementById('editorCancel').addEventListener('click', function() { document.getElementById('editorModal').classList.remove('open'); });
        document.getElementById('addPicBtn').addEventListener('click', addPhotoUrl);
        document.getElementById('uploadPicBtn').addEventListener('click', function() { document.getElementById('picInput').click(); });
        document.getElementById('picInput').addEventListener('change', uploadPic);
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', importData);
        document.getElementById('pushBtn').addEventListener('click', pushCloud);
        document.getElementById('pullBtn').addEventListener('click', pullCloud);
        document.getElementById('proxyBtn').addEventListener('click', testProxy);
    }
}

document.addEventListener('DOMContentLoaded', init);
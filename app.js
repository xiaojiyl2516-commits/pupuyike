// ============================================================
// 浦浦荐逼 - 单页应用（前台 + 后台）
// ============================================================

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#141414'); tg.setBackgroundColor('#141414'); }

const DEFAULT_TEACHERS = [
    {id:'t1',name:'雪莉',tgHandle:'xueli_cd',photos:['https://picsum.photos/seed/xueli1/400/500','https://picsum.photos/seed/xueli2/400/500','https://picsum.photos/seed/xueli3/400/500'],tags:['御姐','嫩妹','高挑'],district:'锦江区',price:1500,status:'营业中',schedule:'10:00-22:00',discount:'首单8折',bio:'身高172cm，气质御姐，空乘出身。',reviews:[{author:'匿名',rating:5,text:'非常棒的服务',date:'2026-06-25'}]},
    {id:'t2',name:'小野猫',tgHandle:'xiaoyemao_cd',photos:['https://picsum.photos/seed/xiaoye1/400/500','https://picsum.photos/seed/xiaoye2/400/500'],tags:['BBW','火辣','少妇'],district:'成华区',price:800,status:'营业中',schedule:'14:00-凌晨2:00',discount:'午间7折',bio:'丰腴少妇，前凸后翘。',reviews:[{author:'赵公子',rating:5,text:'身材爆炸',date:'2026-06-27'}]},
    {id:'t3',name:'紫萱',tgHandle:'zixuan_cd',photos:['https://picsum.photos/seed/zixuan1/400/500','https://picsum.photos/seed/zixuan2/400/500'],tags:['御姐','黑丝','嫩妹'],district:'青羊区',price:1200,status:'营业中',schedule:'11:00-21:00',discount:'新客立减200',bio:'新晋女神，颜值爆表。',reviews:[]},
    {id:'t4',name:'蜜桃',tgHandle:'mitao_cd',photos:['https://picsum.photos/seed/mitao1/400/500'],tags:['嫩妹','甜美'],district:'武侯区',price:1000,status:'休息中',schedule:'今天休息',discount:'',bio:'00后甜美小可爱',reviews:[]},
    {id:'t5',name:'玫瑰',tgHandle:'rose_cd',photos:['https://picsum.photos/seed/rose1/400/500','https://picsum.photos/seed/rose2/400/500'],tags:['御姐','少妇'],district:'锦江区',price:2000,status:'营业中',schedule:'全天24小时',discount:'包夜5000',bio:'成熟御姐，研究生学历。',reviews:[{author:'VIP',rating:5,text:'成都顶级',date:'2026-06-25'}]},
    {id:'t6',name:'糖糖',tgHandle:'tangtang_cd',photos:['https://picsum.photos/seed/tang1/400/500'],tags:['嫩妹','可爱'],district:'金牛区',price:600,status:'营业中',schedule:'全天',discount:'学生特惠',bio:'萌系少女，软萌可爱。',reviews:[]}
];

let teachers = [], currentFilter = 'all', currentTagFilter = 'all', currentTeacherId = null, currentPhotoIdx = 0, currentRating = 0, photoUrls = [''], editingId = null, isAdmin = false;

function loadData() {
    try {
        var saved = localStorage.getItem('cd_teachers_data');
        if (saved) { teachers = JSON.parse(saved); return; }
    } catch(e) {}
    teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
    saveData();
}

function saveData() {
    localStorage.setItem('cd_teachers_data', JSON.stringify(teachers));
    if (typeof hasCloudConfig === 'function' && hasCloudConfig()) {
        saveToCloud(teachers).catch(function(){});
    }
}

// ==================== 前台 ====================
function renderCards(list) {
    var grid = document.getElementById('cardGrid');
    var ct = document.getElementById('teacherCount');
    var badge = document.getElementById('totalBadge');
    if (!grid) return;
    ct.textContent = list.length;
    badge.textContent = list.length;

    if (list.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted)"><i class="fas fa-search" style="font-size:28px;margin-bottom:8px;display:block"></i>没有找到匹配的老师</div>';
        return;
    }

    grid.innerHTML = list.map(function(t) {
        var avg = t.reviews.length ? (t.reviews.reduce(function(s,r){return s+r.rating},0)/t.reviews.length).toFixed(1) : 0;
        return '<div class="teacher-card" data-id="' + t.id + '">' +
            '<div class="card-photo-container">' +
            '<img class="card-photo" src="' + t.photos[0] + '" loading="lazy" onerror="this.style.display='none'">' +
            (t.photos.length > 1 ? '<button class="card-photo-nav prev"><i class="fas fa-chevron-left"></i></button><button class="card-photo-nav next"><i class="fas fa-chevron-right"></i></button><span class="card-photo-counter"><i class="fas fa-images"></i> ' + t.photos.length + '</span>' : '') +
            '<span class="card-status ' + (t.status === '营业中' ? 'active' : 'resting') + '">' + (t.status === '营业中' ? '<span class="dot"></span>' : '') + ' ' + t.status + '</span>' +
            '</div><div class="card-body">' +
            '<div class="card-name-row"><span class="card-name">' + t.name + '</span><span class="card-tg"><i class="fab fa-telegram-plane"></i> @' + t.tgHandle + '</span></div>' +
            '<div class="card-district"><i class="fas fa-map-marker-alt"></i> ' + t.district + '</div>' +
            '<div class="card-tags">' + t.tags.map(function(tg){return '<span class="card-tag">' + tg + '</span>'}).join('') + '</div>' +
            '<div class="card-footer"><span class="card-price">¥' + t.price + ' <small>/次</small></span>' + (avg > 0 ? '<span class="card-rating"><i class="fas fa-star"></i> ' + avg + '</span>' : '') + '</div>' +
            '</div></div>';
    }).join('');

    grid.querySelectorAll('.teacher-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.card-photo-nav')) return;
            openTeacherModal(this.dataset.id);
        });
        var prev = card.querySelector('.card-photo-nav.prev');
        var next = card.querySelector('.card-photo-nav.next');
        var id = card.dataset.id;
        if (prev) prev.addEventListener('click', function(e) { e.stopPropagation(); cardPhotoNav(id, -1); });
        if (next) next.addEventListener('click', function(e) { e.stopPropagation(); cardPhotoNav(id, 1); });
    });
}

function cardPhotoNav(id, dir) {
    var t = teachers.find(function(tc){return tc.id===id});
    if (!t || t.photos.length<=1) return;
    var card = document.querySelector('.teacher-card[data-id="'+id+'"]');
    if (!card) return;
    var img = card.querySelector('.card-photo');
    var cur = parseInt(img.dataset.idx||'0');
    cur = (cur+dir+t.photos.length)%t.photos.length;
    img.dataset.idx = cur;
    img.style.opacity = '0.5';
    setTimeout(function(){img.src=t.photos[cur];img.style.opacity='1'},150);
}

function applyFilters() {
    var list = [...teachers];
    if (currentFilter !== 'all') list = list.filter(function(t){return t.district===currentFilter});
    if (currentTagFilter !== 'all') list = list.filter(function(t){return t.tags.indexOf(currentTagFilter)>=0});
    var sr = document.querySelector('input[name="status"]:checked');
    if (sr && sr.value !== 'all') list = list.filter(function(t){return t.status===sr.value});
    var pMin = document.getElementById('priceMin'), pMax = document.getElementById('priceMax');
    if (pMin && pMin.value) list = list.filter(function(t){return t.price>=parseInt(pMin.value)});
    if (pMax && pMax.value) list = list.filter(function(t){return t.price<=parseInt(pMax.value)});
    var si = document.getElementById('searchInput');
    if (si && si.value.trim()) {
        var q = si.value.trim().toLowerCase();
        list = list.filter(function(t){return t.name.toLowerCase().includes(q)||t.tgHandle.toLowerCase().includes(q)||t.tags.some(function(tag){return tag.toLowerCase().includes(q)})||t.district.includes(q)||(t.bio||'').toLowerCase().includes(q)});
    }
    renderCards(list);
}

// ==================== 老师详情 ====================
function openTeacherModal(id) {
    var t = teachers.find(function(tc){return tc.id===id});
    if (!t) return;
    currentTeacherId = id; currentPhotoIdx = 0;
    document.getElementById('modalName').textContent = t.name;
    document.getElementById('modalTG').textContent = t.tgHandle;
    document.getElementById('modalDistrict').textContent = t.district;
    document.getElementById('modalPrice').textContent = '¥' + t.price + ' / 次';
    document.getElementById('modalSchedule').textContent = t.schedule;
    document.getElementById('modalDiscount').textContent = t.discount || '暂无';
    document.getElementById('modalBio').textContent = t.bio || '暂无';
    var st = document.getElementById('modalStatus');
    st.textContent = t.status; st.className = 'modal-status ' + (t.status === '营业中' ? 'online' : 'offline');
    document.getElementById('modalTags').innerHTML = t.tags.map(function(tag){return '<span class="modal-tag">'+tag+'</span>'}).join('');
    renderGallery(t.photos);
    renderReviews(t.reviews);
    document.getElementById('teacherModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function renderGallery(photos) {
    var img = document.getElementById('galleryImg');
    var counter = document.getElementById('galleryCounter');
    var thumbs = document.getElementById('galleryThumbs');
    if (!photos||!photos.length) {img.src='';counter.textContent='0/0';thumbs.innerHTML='';return}
    currentPhotoIdx = Math.min(currentPhotoIdx, photos.length-1);
    img.src = photos[currentPhotoIdx];
    counter.textContent = (currentPhotoIdx+1) + '/' + photos.length;
    thumbs.innerHTML = photos.map(function(p,i){
        return '<div class="gallery-thumb '+(i===currentPhotoIdx?'active':'')+'" data-idx="'+i+'"><img src="'+p+'" loading="lazy"></div>';
    }).join('');
    thumbs.querySelectorAll('.gallery-thumb').forEach(function(el){
        el.addEventListener('click',function(){currentPhotoIdx=parseInt(this.dataset.idx);renderGallery(photos)});
    });
}

function navigateGallery(dir) {
    var t = teachers.find(function(tc){return tc.id===currentTeacherId});
    if (!t||t.photos.length<=1) return;
    currentPhotoIdx = (currentPhotoIdx+dir+t.photos.length)%t.photos.length;
    renderGallery(t.photos);
}

function renderReviews(reviews) {
    var c = document.getElementById('reviewsContainer');
    if (!reviews||!reviews.length) {c.innerHTML='<p class="no-reviews">暂无评价</p>';return}
    c.innerHTML = reviews.map(function(r){
        return '<div class="review-item"><div class="review-meta"><span class="review-author">'+(r.author||'匿名')+'</span><span class="review-stars">'+'★'.repeat(Math.min(r.rating,5))+'☆'.repeat(5-Math.min(r.rating,5))+'</span></div><div class="review-text">'+r.text+'</div></div>';
    }).join('');
}

// ==================== 后台 ====================
function renderAdminTable() {
    document.getElementById('dataCountLabel').textContent = teachers.length;
    var tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = teachers.map(function(t){
        return '<tr><td><strong style="color:#fff">'+t.name+'</strong></td><td style="color:var(--cyan)">@'+t.tgHandle+'</td><td>'+t.district+'</td><td style="color:var(--accent);font-weight:700">¥'+t.price+'</td><td><div class="tag-pills">'+t.tags.map(function(tg){return '<span class="tag-pill">'+tg+'</span>'}).join('')+'</div></td><td><span class="status-badge '+(t.status==='营业中'?'online':'offline')+'">'+t.status+'</span></td><td>'+t.photos.length+'张</td><td><button class="act-btn edit" data-id="'+t.id+'"><i class="fas fa-edit"></i></button> <button class="act-btn tog" data-id="'+t.id+'"><i class="fas fa-sync-alt"></i></button> <button class="act-btn del" data-id="'+t.id+'"><i class="fas fa-trash"></i></button></td></tr>';
    }).join('');
    tbody.querySelectorAll('.edit').forEach(function(b){b.addEventListener('click',function(){openEditor(this.dataset.id)})});
    tbody.querySelectorAll('.tog').forEach(function(b){b.addEventListener('click',function(){toggleStatus(this.dataset.id)})});
    tbody.querySelectorAll('.del').forEach(function(b){b.addEventListener('click',function(){deleteTeacher(this.dataset.id)})});
}

function openEditor(id) {
    editingId = id;
    var t = id ? teachers.find(function(tc){return tc.id===id}) : null;
    document.getElementById('editorTitle').textContent = t ? '编辑 - '+t.name : '添加老师';
    document.getElementById('editId').value = id||'';
    if (t) {
        document.getElementById('editName').value = t.name;
        document.getElementById('editTG').value = t.tgHandle;
        document.getElementById('editDistrict').value = t.district;
        document.getElementById('editPrice').value = t.price;
        document.getElementById('editStatus').value = t.status;
        document.getElementById('editSchedule').value = t.schedule||'';
        document.getElementById('editDiscount').value = t.discount||'';
        document.getElementById('editBio').value = t.bio||'';
        document.getElementById('editTags').value = t.tags.join(', ');
        photoUrls = t.photos.slice();
    } else {
        ['editName','editTG','editPrice','editSchedule','editDiscount','editBio','editTags'].forEach(function(f){document.getElementById(f).value=''});
        document.getElementById('editDistrict').value = '锦江区';
        document.getElementById('editStatus').value = '营业中';
        photoUrls = [''];
    }
    renderPhotoInputs();
    document.getElementById('editorModal').classList.add('open');
}

function closeEditor() {document.getElementById('editorModal').classList.remove('open');editingId=null}

function renderPhotoInputs() {
    var c = document.getElementById('photoList');
    c.innerHTML = photoUrls.map(function(url,i){
        return '<div class="p-input">'+(url&&url.startsWith('data:')?'<img src="'+url+'" style="width:28px;height:28px;border-radius:4px;object-fit:cover">':'')+'<input type="text" value="'+url+'" placeholder="照片'+(i+1)+'" data-idx="'+i+'">'+(photoUrls.length>1?'<button class="rm-p-btn" data-idx="'+i+'"><i class="fas fa-times"></i></button>':'')+'</div>';
    }).join('');
    c.querySelectorAll('input').forEach(function(inp){inp.addEventListener('input',function(){photoUrls[parseInt(this.dataset.idx)]=this.value})});
    c.querySelectorAll('.rm-p-btn').forEach(function(btn){btn.addEventListener('click',function(){photoUrls.splice(parseInt(this.dataset.idx),1);if(photoUrls.length===0)photoUrls=[''];renderPhotoInputs()})});
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
    if (!name||!tg||!price) {alert('请填写花名、TG账号和价格');return}
    var photos = photoUrls.filter(function(u){return u.trim()!==''});
    if (photos.length===0) {alert('请至少添加一张照片');return}
    var tags = tagsRaw ? tagsRaw.split(/[,，]/).map(function(s){return s.trim()}).filter(Boolean) : [];
    var id = document.getElementById('editId').value;
    if (id) {
        var t = teachers.find(function(tc){return tc.id===id});
        if (t) {t.name=name;t.tgHandle=tg;t.district=district;t.price=price;t.status=status;t.schedule=schedule||'-';t.discount=discount;t.bio=bio;t.tags=tags;t.photos=photos}
    } else {
        teachers.push({id:'t'+Date.now(),name:name,tgHandle:tg,district:district,price:price,status:status,schedule:schedule||'-',discount:discount,bio:bio,tags:tags,photos:photos,reviews:[]});
    }
    saveData(); closeEditor(); renderAdminTable(); applyFilters(); updateTagFilters();
}

function toggleStatus(id) {
    var t = teachers.find(function(tc){return tc.id===id});
    if (!t) return;
    t.status = t.status==='营业中'?'休息中':'营业中';
    saveData(); renderAdminTable(); applyFilters();
}

function deleteTeacher(id) {
    if (!confirm('确定删除？')) return;
    teachers = teachers.filter(function(t){return t.id!==id});
    saveData(); renderAdminTable(); applyFilters();
}

function exportData() {
    var json = JSON.stringify(teachers,null,2);
    document.getElementById('importData').value = json;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.download = 'teachers-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
}

function importData() {
    var raw = document.getElementById('importData').value.trim();
    if (!raw) {alert('请粘贴JSON');return}
    try {
        var data = JSON.parse(raw);
        if (!Array.isArray(data)) {alert('需要数组格式');return}
        if (!confirm('导入将覆盖当前数据，确定？')) return;
        teachers = data; saveData(); renderAdminTable(); applyFilters(); updateTagFilters();
        alert('导入成功！共 '+teachers.length+' 位老师');
    } catch(e) {alert('JSON错误: '+e.message)}
}

function fillPhotoUrl(url) {
    var idx = -1;
    for (var i=0;i<photoUrls.length;i++) {if(!photoUrls[i]||!photoUrls[i].trim()){idx=i;break}}
    if (idx>=0) photoUrls[idx]=url; else photoUrls.push(url);
    renderPhotoInputs();
}

function uploadToImgur(file) {
    var p = document.getElementById('uploadProgress');
    var s = document.getElementById('uploadStatus');
    p.style.display='block';s.innerHTML='处理 '+file.name+' ...';
    if (file.size>2*1024*1024) {s.innerHTML='⚠️ 超过2MB';setTimeout(function(){p.style.display='none'},2000);return}
    var r = new FileReader();
    r.onload=function(e){var kb=Math.round(e.target.result.length/1024);s.innerHTML='✅ ('+kb+'KB)';setTimeout(function(){p.style.display='none'},1000);fillPhotoUrl(e.target.result)};
    r.onerror=function(){s.innerHTML='❌ 读取失败';setTimeout(function(){p.style.display='none'},2000)};
    r.readAsDataURL(file);
}

// ==================== 签到 ====================
function initCheckin() {
    document.getElementById('checkinToggle').addEventListener('click',function(){openCheckin()});
    document.getElementById('checkinModalClose').addEventListener('click',closeCheckin);
    document.getElementById('checkinModal').addEventListener('click',function(e){if(e.target===this)closeCheckin()});
    document.getElementById('checkinAsWolf').addEventListener('click',wolfCheckin);
    document.getElementById('wolfCheckinDone').addEventListener('click',closeCheckin);
    document.getElementById('checkinAsTeacher').addEventListener('click',showTeacherList);
    document.getElementById('teacherCheckinBack').addEventListener('click',showCheckinRoles);
    document.getElementById('teacherCheckinFinished').addEventListener('click',closeCheckin);
}

function openCheckin() {
    document.getElementById('checkinRoleSelect').style.display='flex';
    ['wolfCheckinResult','teacherCheckinResult','teacherCheckinDone'].forEach(function(id){document.getElementById(id).style.display='none'});
    document.getElementById('checkinModal').classList.add('open');
}
function closeCheckin(){document.getElementById('checkinModal').classList.remove('open')}
function showCheckinRoles(){openCheckin()}

function wolfCheckin() {
    var data = JSON.parse(localStorage.getItem('ppjb_checkin')||'{"points":0,"lastDate":""}');
    var today = new Date().toISOString().slice(0,10);
    document.getElementById('checkinRoleSelect').style.display='none';
    document.getElementById('wolfCheckinResult').style.display='block';
    if (data.lastDate===today) {
        document.getElementById('wolfCheckinMsg').textContent='今日已签到，明天再来吧！';
    } else {
        data.points+=1;data.lastDate=today;
        localStorage.setItem('ppjb_checkin',JSON.stringify(data));
        document.getElementById('wolfCheckinMsg').textContent='+1 积分！坚持签到获取福利';
    }
    document.getElementById('wolfPointsDisplay').textContent = data.points+' 分';
}

function showTeacherList() {
    document.getElementById('checkinRoleSelect').style.display='none';
    document.getElementById('teacherCheckinResult').style.display='block';
    var c = document.getElementById('teacherCheckinList');
    if (!teachers.length) {c.innerHTML='<p style="color:var(--text-muted);padding:16px">暂无老师</p>';return}
    c.innerHTML = teachers.map(function(t){
        return '<div class="teacher-checkin-item" data-id="'+t.id+'" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(124,77,255,0.06);border-radius:8px;margin-bottom:4px;cursor:pointer">'+
            '<span style="font-weight:600;flex:1">'+t.name+'</span>'+
            '<span style="font-size:10px;padding:2px 6px;border-radius:5px;background:'+(t.status==='营业中'?'rgba(0,229,255,0.15)':'rgba(124,77,255,0.15)')+';color:'+(t.status==='营业中'?'var(--cyan)':'var(--text-muted)')+'">'+t.status+'</span>'+
            '<i class="fas fa-chevron-right" style="color:var(--text-muted);font-size:10px"></i></div>';
    }).join('');
    c.querySelectorAll('.teacher-checkin-item').forEach(function(el){
        el.addEventListener('click',function(){
            var t = teachers.find(function(tc){return tc.id===this.dataset.id});
            if (!t) return;
            t.status = t.status==='营业中'?'休息中':'营业中';
            saveData(); applyFilters(); renderAdminTable();
            document.getElementById('teacherCheckinResult').style.display='none';
            document.getElementById('teacherCheckinDone').style.display='block';
            document.getElementById('teacherCheckinMsg').textContent = t.name+' · 已'+(t.status==='营业中'?'营业中 ✅':'休息中 💤');
        });
    });
}

// ==================== 云状态 ====================
function updateCloudStatusBadge() {
    var el = document.getElementById('cloudStatus');
    if (!el) return;
    if (typeof hasCloudConfig==='function'&&hasCloudConfig()) {
        el.innerHTML = '☁️ 云端已配置';
        el.style.color = 'var(--cyan)';
    } else {
        el.innerHTML = '☁️ 未配置云端';
        el.style.color = 'var(--text-muted)';
    }
}

// ==================== 初始化 ====================
async function init() {
    loadData();

    // 尝试云端
    if (typeof hasCloudConfig==='function'&&hasCloudConfig()) {
        try {
            var cd = await loadFromCloud();
            if (cd&&cd.length>0) {teachers=cd;localStorage.setItem('cd_teachers_data',JSON.stringify(teachers))}
        } catch(e){}
    }

    if (!document.getElementById('cardGrid')) return;

    // ---- 前台绑定 ----
    document.querySelectorAll('.nav-link').forEach(function(l){
        l.addEventListener('click',function(e){e.preventDefault();document.querySelectorAll('.nav-link').forEach(function(x){x.classList.remove('active')});this.classList.add('active');currentFilter=this.dataset.filter;applyFilters();document.getElementById('filterPanel').classList.remove('open')});
    });
    document.getElementById('searchToggle').addEventListener('click',function(){document.getElementById('searchBar').classList.toggle('open');if(document.getElementById('searchBar').classList.contains('open'))setTimeout(function(){document.getElementById('searchInput').focus()},100)});
    document.getElementById('searchClose').addEventListener('click',function(){document.getElementById('searchBar').classList.remove('open');document.getElementById('searchInput').value='';applyFilters()});
    document.getElementById('searchInput').addEventListener('input',applyFilters);
    document.getElementById('filterToggle').addEventListener('click',function(){document.getElementById('filterPanel').classList.toggle('open')});
    document.getElementById('priceFilterBtn').addEventListener('click',applyFilters);
    document.querySelectorAll('input[name="status"]').forEach(function(r){r.addEventListener('change',applyFilters)});
    document.getElementById('modalClose').addEventListener('click',function(){document.getElementById('teacherModal').classList.remove('open');document.body.style.overflow=''});
    document.getElementById('teacherModal').addEventListener('click',function(e){if(e.target===this){this.classList.remove('open');document.body.style.overflow=''}});
    document.getElementById('galleryPrev').addEventListener('click',function(){navigateGallery(-1)});
    document.getElementById('galleryNext').addEventListener('click',function(){navigateGallery(1)});
    document.addEventListener('keydown',function(e){if(!document.getElementById('teacherModal').classList.contains('open'))return;if(e.key==='ArrowLeft')navigateGallery(-1);if(e.key==='ArrowRight')navigateGallery(1);if(e.key==='Escape'){document.getElementById('teacherModal').classList.remove('open');document.body.style.overflow=''}});
    (function(){var sx;document.getElementById('galleryMain').addEventListener('touchstart',function(e){sx=e.changedTouches[0].screenX});document.getElementById('galleryMain').addEventListener('touchend',function(e){var d=sx-e.changedTouches[0].screenX;if(Math.abs(d)>50)navigateGallery(d>0?1:-1)})})();
    document.getElementById('addReviewBtn').addEventListener('click',function(){document.getElementById('reviewModal').classList.add('open')});
    document.getElementById('reviewCancel').addEventListener('click',function(){document.getElementById('reviewModal').classList.remove('open')});
    document.getElementById('reviewSubmit').addEventListener('click',function(){
        if (!currentTeacherId||!currentRating) {alert('请先评分');return}
        var txt = document.getElementById('reviewText').value.trim();
        if (!txt) {alert('请填写评价内容');return}
        var name = document.getElementById('reviewerName').value.trim()||'匿名用户';
        var t = teachers.find(function(tc){return tc.id===currentTeacherId});
        if (!t) return;
        t.reviews.push({author:name,rating:currentRating,text:txt,date:new Date().toISOString().slice(0,10)});
        saveData();currentRating=0;document.getElementById('reviewText').value='';document.getElementById('reviewerName').value='';document.querySelectorAll('.star').forEach(function(s){s.classList.remove('active')});document.getElementById('ratingText').textContent='点击评分';renderReviews(t.reviews);applyFilters();document.getElementById('reviewModal').classList.remove('open');
    });
    document.querySelectorAll('.star').forEach(function(s){
        s.addEventListener('click',function(){currentRating=parseInt(this.dataset.val);document.querySelectorAll('.star').forEach(function(x){x.classList.toggle('active',parseInt(x.dataset.val)<=currentRating)});document.getElementById('ratingText').textContent=['','差','一般','不错','很好','完美'][currentRating]});
    });
    window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>50)});

    // -- 签到 --
    initCheckin();

    // -- 视图切换 --
    document.getElementById('adminToggle').addEventListener('click',function(){
        isAdmin = !isAdmin;
        document.getElementById('frontendView').classList.toggle('active',!isAdmin);
        document.getElementById('adminView').classList.toggle('active',isAdmin);
        document.querySelectorAll('.frontend-only').forEach(function(el){el.style.display=isAdmin?'none':''});
        document.getElementById('navbar').classList.toggle('in-admin',isAdmin);
        this.classList.toggle('active',isAdmin);
        if (isAdmin) {renderAdminTable();updateCloudStatusBadge()}
    });

    // ---- 后台绑定 ----
    document.getElementById('addTeacherBtn').addEventListener('click',function(){openEditor(null)});
    document.getElementById('editorSave').addEventListener('click',saveTeacher);
    document.getElementById('editorCancel').addEventListener('click',closeEditor);
    document.getElementById('addPhotoBtn').addEventListener('click',function(){photoUrls.push('');renderPhotoInputs()});
    document.getElementById('imgurFileInput').addEventListener('change',function(e){if(this.files&&this.files[0])uploadToImgur(this.files[0]);this.value=''});
    document.getElementById('uploadNewBtn').addEventListener('click',function(){document.getElementById('imgurFileInput').click()});
    document.getElementById('exportBtn').addEventListener('click',exportData);
    document.getElementById('importBtn').addEventListener('click',importData);
    document.getElementById('cloudPushBtn').addEventListener('click',async function(){
        if (typeof hasCloudConfig==='function'&&hasCloudConfig()) {
            document.getElementById('cloudPushBtn').disabled=true;
            var ok = await saveToCloud(teachers);
            document.getElementById('cloudPushBtn').disabled=false;
            document.getElementById('cloudMessage').textContent = ok?'✅ 推送成功！':'❌ 推送失败，点测试代理诊断';
            document.getElementById('cloudMessage').style.color = ok?'var(--green)':'var(--accent)';
        } else {
            document.getElementById('cloudMessage').textContent = '⚠️ 未配置云端';
            document.getElementById('cloudMessage').style.color = 'var(--orange)';
        }
    });
    document.getElementById('cloudTestProxyBtn').addEventListener('click',async function(){
        document.getElementById('cloudMessage').textContent = '⏳ 测试中...';
        document.getElementById('cloudMessage').style.color = 'var(--cyan)';
        if (typeof testProxyConnection==='function') {
            var r = await testProxyConnection();
            document.getElementById('cloudMessage').textContent = r.ok?'✅ '+r.msg:'❌ '+r.msg;
            document.getElementById('cloudMessage').style.color = r.ok?'var(--green)':'var(--accent)';
        } else {
            document.getElementById('cloudMessage').textContent = '❌ cloud.js 未加载';
            document.getElementById('cloudMessage').style.color = 'var(--accent)';
        }
    });
    document.getElementById('cloudLoadBtn').addEventListener('click',async function(){
        if (typeof loadFromCloud==='function') {
            document.getElementById('cloudMessage').textContent = '⏳ 拉取中...';
            document.getElementById('cloudMessage').style.color = 'var(--cyan)';
            var cd = await loadFromCloud();
            if (cd&&cd.length>0) {teachers=cd;saveData();renderAdminTable();applyFilters();updateTagFilters();document.getElementById('cloudMessage').textContent='✅ 拉取 '+cd.length+' 位老师'} else {document.getElementById('cloudMessage').textContent='❌ 拉取失败'}
            document.getElementById('cloudMessage').style.color = 'var(--green)';
        } else {
            document.getElementById('cloudMessage').textContent = '❌ cloud.js 未加载';
        }
    });

    // ---- 标签筛选 ----
    updateTagFilters();
    applyFilters();
}

function updateTagFilters() {
    var c = document.getElementById('tagFilters');
    if (!c) return;
    var tags = new Set();
    teachers.forEach(function(t){t.tags.forEach(function(tag){tags.add(tag)})});
    c.innerHTML = '<span class="filter-tag active" data-tag="all">全部</span>' + Array.from(tags).map(function(tag){return '<span class="filter-tag" data-tag="'+tag+'">'+tag+'</span>'}).join('');
    c.querySelectorAll('.filter-tag').forEach(function(el){
        el.addEventListener('click',function(){c.querySelectorAll('.filter-tag').forEach(function(e){e.classList.remove('active')});this.classList.add('active');currentTagFilter=this.dataset.tag;applyFilters()});
    });
}

document.addEventListener('DOMContentLoaded', init);

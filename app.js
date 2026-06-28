// ============================================================
// 蓉城·名媛 - Telegram Mini App 主逻辑
// ============================================================

// ---------- Telegram WebApp 初始化 ----------
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#141414');
    tg.setBackgroundColor('#141414');
}

// ---------- 默认数据 ----------
const DEFAULT_TEACHERS = [
    {
        id: 't1',
        name: '雪莉',
        tgHandle: 'xueli_cd',
        photos: [
            'https://picsum.photos/seed/xueli1/400/500',
            'https://picsum.photos/seed/xueli2/400/500',
            'https://picsum.photos/seed/xueli3/400/500'
        ],
        tags: ['御姐', '嫩妹', '高挑'],
        district: '锦江区',
        price: 1500,
        status: '营业中',
        schedule: '10:00 - 22:00',
        discount: '首单8折 · 包夜享9折',
        bio: '身高172cm，气质御姐，空乘出身。温柔体贴，服务意识极佳，给你顶级陪伴体验。',
        reviews: [
            { author: '匿名用户', rating: 5, text: '非常棒的服务，气质很好！', date: '2026-06-25' },
            { author: '成都老司机', rating: 4, text: '性价比很高，会再约。', date: '2026-06-26' }
        ]
    },
    {
        id: 't2',
        name: '小野猫',
        tgHandle: 'xiaoyemao_cd',
        photos: [
            'https://picsum.photos/seed/xiaoye1/400/500',
            'https://picsum.photos/seed/xiaoye2/400/500',
            'https://picsum.photos/seed/xiaoye3/400/500'
        ],
        tags: ['BBW', '火辣', '少妇'],
        district: '成华区',
        price: 800,
        status: '营业中',
        schedule: '14:00 - 凌晨2:00',
        discount: '午间特惠 7折',
        bio: '丰腴少妇，前凸后翘。性格开朗热情，会聊天会调情，让你宾至如归。',
        reviews: [
            { author: '赵公子', rating: 5, text: '身材爆炸好，服务满分！', date: '2026-06-27' }
        ]
    },
    {
        id: 't3',
        name: '紫萱',
        tgHandle: 'zixuan_cd',
        photos: [
            'https://picsum.photos/seed/zixuan1/400/500',
            'https://picsum.photos/seed/zixuan2/400/500',
            'https://picsum.photos/seed/zixuan3/400/500',
            'https://picsum.photos/seed/zixuan4/400/500'
        ],
        tags: ['御姐', '黑丝', '嫩妹'],
        district: '青羊区',
        price: 1200,
        status: '营业中',
        schedule: '11:00 - 21:00',
        discount: '新客立减200',
        bio: '新晋女神，颜值爆表。168cm黄金比例，长腿御姐，带你体验不一样的夜晚。',
        reviews: []
    },
    {
        id: 't4',
        name: '蜜桃',
        tgHandle: 'mitao_cd',
        photos: [
            'https://picsum.photos/seed/mitao1/400/500',
            'https://picsum.photos/seed/mitao2/400/500'
        ],
        tags: ['嫩妹', '甜美', '清纯'],
        district: '武侯区',
        price: 1000,
        status: '休息中',
        schedule: '今天休息',
        discount: '',
        bio: '00后甜美小可爱，刚入行不久，清纯可人。喜欢温柔的你~',
        reviews: []
    },
    {
        id: 't5',
        name: '玫瑰',
        tgHandle: 'rose_cd',
        photos: [
            'https://picsum.photos/seed/rose1/400/500',
            'https://picsum.photos/seed/rose2/400/500',
            'https://picsum.photos/seed/rose3/400/500'
        ],
        tags: ['御姐', '少妇', '成熟'],
        district: '锦江区',
        price: 2000,
        status: '营业中',
        schedule: '全天24小时',
        discount: '包夜特惠5000',
        bio: '成熟御姐，28岁知性美女。研究生学历，谈吐优雅，气质出众。顶级体验，价格说明一切。',
        reviews: [
            { author: '成功人士', rating: 5, text: '非常优雅的女士，聊天很开心。', date: '2026-06-24' },
            { author: 'VIP客人', rating: 5, text: '成都顶级，无可挑剔。', date: '2026-06-25' },
            { author: '老顾客', rating: 5, text: '服务一直很稳定，推荐。', date: '2026-06-27' }
        ]
    },
    {
        id: 't6',
        name: '糖糖',
        tgHandle: 'tangtang_cd',
        photos: [
            'https://picsum.photos/seed/tang1/400/500',
            'https://picsum.photos/seed/tang2/400/500'
        ],
        tags: ['嫩妹', '萝莉', '可爱'],
        district: '金牛区',
        price: 600,
        status: '营业中',
        schedule: '全天',
        discount: '学生特惠',
        bio: '萌系少女，软萌可爱。声音好听，会撒娇。适合喜欢小鸟依人类型的你~',
        reviews: []
    }
];

// ---------- 全局状态 ----------
let teachers = [];
let currentFilter = 'all';
let currentTagFilter = 'all';
let currentTeacherId = null;
let currentPhotoIdx = 0;
let currentRating = 0;
let filteredTeachers = [];

// ---------- 数据加载与持久化 ----------
function loadData() {
    const saved = localStorage.getItem('cd_teachers_data');
    if (saved) {
        try {
            teachers = JSON.parse(saved);
            return;
        } catch(e) {}
    }
    teachers = JSON.parse(JSON.stringify(DEFAULT_TEACHERS));
    saveData();
}

function saveData() {
    localStorage.setItem('cd_teachers_data', JSON.stringify(teachers));
}

// ---------- 渲染函数 ----------
function renderCards(list) {
    const grid = document.getElementById('cardGrid');
    const count = document.getElementById('teacherCount');
    const badge = document.getElementById('totalBadge');

    filteredTeachers = list;

    if (list.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>没有找到匹配的老师</p></div>';
        if (count) count.textContent = '0';
        if (badge) badge.textContent = '0';
        return;
    }

    if (count) count.textContent = list.length;
    if (badge) badge.textContent = list.length;

    grid.innerHTML = list.map(t => createCardHTML(t)).join('');

    // 绑定卡片点击事件
    grid.querySelectorAll('.teacher-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.card-photo-nav')) return;
            const id = this.dataset.id;
            openTeacherModal(id);
        });

        // 照片导航事件
        const id = card.dataset.id;
        const prevBtn = card.querySelector('.card-photo-nav.prev');
        const nextBtn = card.querySelector('.card-photo-nav.next');
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navigateCardPhoto(id, -1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navigateCardPhoto(id, 1);
            });
        }
    });
}

function createCardHTML(t) {
    const activeClass = t.status === '营业中' ? 'active' : 'resting';
    const dot = t.status === '营业中' ? '<span class="dot"></span>' : '';
    const avgRating = calcAvgRating(t.reviews);
    const ratingStars = avgRating > 0 ? '<i class="fas fa-star"></i>' + avgRating.toFixed(1) : '';

    return `
        <div class="teacher-card" data-id="${t.id}">
            <div class="card-photo-container">
                <img class="card-photo" src="${t.photos[0]}" alt="${t.name}" loading="lazy">
                ${t.photos.length > 1 ? `
                    <button class="card-photo-nav prev"><i class="fas fa-chevron-left"></i></button>
                    <button class="card-photo-nav next"><i class="fas fa-chevron-right"></i></button>
                    <span class="card-photo-counter"><i class="fas fa-images"></i> ${t.photos.length}</span>
                ` : ''}
                <span class="card-status ${activeClass}">${dot} ${t.status}</span>
            </div>
            <div class="card-body">
                <div class="card-name-row">
                    <span class="card-name">${t.name}</span>
                    <span class="card-tg"><i class="fab fa-telegram-plane"></i> @${t.tgHandle}</span>
                </div>
                <div class="card-district"><i class="fas fa-map-marker-alt"></i> ${t.district}</div>
                <div class="card-tags">
                    ${t.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-price">¥${t.price} <small>/次</small></span>
                    ${ratingStars ? `<span class="card-rating">${ratingStars}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ---------- 照片导航 ----------
function navigateCardPhoto(id, direction) {
    const t = teachers.find(tc => tc.id === id);
    if (!t || t.photos.length <= 1) return;
    const card = document.querySelector(`.teacher-card[data-id="${id}"]`);
    if (!card) return;
    const img = card.querySelector('.card-photo');
    if (!img) return;
    let current = parseInt(img.dataset.idx || '0');
    current = (current + direction + t.photos.length) % t.photos.length;
    img.dataset.idx = current;
    img.style.opacity = '0.5';
    setTimeout(() => {
        img.src = t.photos[current];
        img.style.opacity = '1';
    }, 150);
}

// ---------- 模态框 - 老师详情 ----------
function openTeacherModal(id) {
    const t = teachers.find(tc => tc.id === id);
    if (!t) return;
    currentTeacherId = id;
    currentPhotoIdx = 0;

    document.getElementById('modalName').textContent = t.name;
    document.getElementById('modalTG').textContent = t.tgHandle;
    document.getElementById('modalDistrict').textContent = t.district;
    document.getElementById('modalPrice').textContent = '¥' + t.price + ' / 次';
    document.getElementById('modalSchedule').textContent = t.schedule;
    document.getElementById('modalDiscount').textContent = t.discount || '暂无';
    document.getElementById('modalBio').textContent = t.bio || '暂无简介';

    const statusEl = document.getElementById('modalStatus');
    statusEl.textContent = t.status;
    statusEl.className = 'modal-status ' + (t.status === '营业中' ? 'online' : 'offline');

    // Tags
    const tagsEl = document.getElementById('modalTags');
    tagsEl.innerHTML = t.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('');

    // Photo Gallery
    renderGallery(t.photos);

    // Reviews
    renderReviews(t.reviews);

    document.getElementById('teacherModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function renderGallery(photos) {
    const img = document.getElementById('galleryImg');
    const counter = document.getElementById('galleryCounter');
    const thumbs = document.getElementById('galleryThumbs');

    if (!photos || photos.length === 0) {
        img.src = 'https://picsum.photos/seed/placeholder/400/500';
        counter.textContent = '0 / 0';
        thumbs.innerHTML = '';
        return;
    }

    currentPhotoIdx = Math.min(currentPhotoIdx, photos.length - 1);
    img.src = photos[currentPhotoIdx];
    counter.textContent = `${currentPhotoIdx + 1} / ${photos.length}`;

    thumbs.innerHTML = photos.map((p, i) => `
        <div class="gallery-thumb ${i === currentPhotoIdx ? 'active' : ''}" data-idx="${i}">
            <img src="${p}" alt="" loading="lazy">
        </div>
    `).join('');

    thumbs.querySelectorAll('.gallery-thumb').forEach(el => {
        el.addEventListener('click', function() {
            currentPhotoIdx = parseInt(this.dataset.idx);
            renderGallery(photos);
        });
    });
}

function navigateGallery(dir) {
    const t = teachers.find(tc => tc.id === currentTeacherId);
    if (!t) return;
    const photos = t.photos;
    if (photos.length <= 1) return;
    currentPhotoIdx = (currentPhotoIdx + dir + photos.length) % photos.length;
    renderGallery(photos);
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="no-reviews">暂无评价</p>';
        return;
    }
    container.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="review-meta">
                <span class="review-author">${r.author || '匿名'}</span>
                <span class="review-stars">${'★'.repeat(Math.min(r.rating, 5))}${'☆'.repeat(5 - Math.min(r.rating, 5))}</span>
            </div>
            <div class="review-text">${r.text}</div>
        </div>
    `).join('');
}

function calcAvgRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ---------- 筛选与搜索 ----------
function applyFilters() {
    let list = [...teachers];

    // District filter
    if (currentFilter !== 'all') {
        list = list.filter(t => t.district === currentFilter);
    }

    // Tag filter
    if (currentTagFilter !== 'all') {
        list = list.filter(t => t.tags.includes(currentTagFilter));
    }

    // Status filter
    const statusRadio = document.querySelector('input[name="status"]:checked');
    if (statusRadio && statusRadio.value !== 'all') {
        list = list.filter(t => t.status === statusRadio.value);
    }

    // Price filter
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    if (priceMin && priceMin.value) {
        list = list.filter(t => t.price >= parseInt(priceMin.value));
    }
    if (priceMax && priceMax.value) {
        list = list.filter(t => t.price <= parseInt(priceMax.value));
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        const q = searchInput.value.trim().toLowerCase();
        list = list.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.tgHandle.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q)) ||
            t.district.includes(q) ||
            (t.bio || '').toLowerCase().includes(q)
        );
    }

    renderCards(list);
}

// ---------- 标签筛选动态生成 ----------
function updateTagFilters() {
    const container = document.getElementById('tagFilters');
    const allTags = new Set();
    teachers.forEach(t => t.tags.forEach(tag => allTags.add(tag)));

    const tagsHtml = ['<span class="filter-tag active" data-tag="all">全部</span>'];
    allTags.forEach(tag => {
        tagsHtml.push(`<span class="filter-tag" data-tag="${tag}">${tag}</span>`);
    });
    container.innerHTML = tagsHtml.join('');

    container.querySelectorAll('.filter-tag').forEach(el => {
        el.addEventListener('click', function() {
            container.querySelectorAll('.filter-tag').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            currentTagFilter = this.dataset.tag;
            applyFilters();
        });
    });
}

// ---------- 签到功能 ----------
function handleCheckin(teacherId) {
    const t = teachers.find(tc => tc.id === teacherId);
    if (!t) return;
    t.status = t.status === '营业中' ? '休息中' : '营业中';
    if (t.status === '营业中') {
        t.schedule = '已签到 · 今日营业中';
    } else {
        t.schedule = '已签到 · 今日休息';
    }
    saveData();
    applyFilters();

    // Show banner
    const banner = document.getElementById('checkinBanner');
    banner.querySelector('span').textContent =
        t.status === '营业中' ? `${t.name} 已签到 — 今日开课状态已更新为营业中` :
        `${t.name} 已签到 — 今日开课状态已更新为休息中`;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 3000);
}

// ---------- 评价提交 ----------
function submitReview() {
    if (!currentTeacherId || currentRating === 0) {
        alert('请先评分！');
        return;
    }
    const text = document.getElementById('reviewText').value.trim();
    if (!text) {
        alert('请填写评价内容！');
        return;
    }
    const name = document.getElementById('reviewerName').value.trim() || '匿名用户';
    const t = teachers.find(tc => tc.id === currentTeacherId);
    if (!t) return;

    const today = new Date().toISOString().slice(0, 10);
    t.reviews.push({
        author: name,
        rating: currentRating,
        text: text,
        date: today
    });
    saveData();

    // Reset form
    currentRating = 0;
    document.getElementById('reviewText').value = '';
    document.getElementById('reviewerName').value = '';
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    document.getElementById('ratingText').textContent = '点击评分';

    // Update modal
    renderReviews(t.reviews);
    document.getElementById('reviewModal').classList.remove('open');

    // Update card rating
    applyFilters();
}

// ---------- 初始化 ----------
function init() {
    loadData();

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFilters();
            // Close filter panel
            document.getElementById('filterPanel').classList.remove('open');
        });
    });

    // Search toggle
    document.getElementById('searchToggle').addEventListener('click', () => {
        const bar = document.getElementById('searchBar');
        bar.classList.toggle('open');
        if (bar.classList.contains('open')) {
            document.getElementById('searchInput').focus();
        }
    });
    document.getElementById('searchClose').addEventListener('click', () => {
        document.getElementById('searchBar').classList.remove('open');
        document.getElementById('searchInput').value = '';
        applyFilters();
    });
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    // Filter toggle
    document.getElementById('filterToggle').addEventListener('click', () => {
        document.getElementById('filterPanel').classList.toggle('open');
    });

    // Price filter
    document.getElementById('priceFilterBtn').addEventListener('click', applyFilters);

    // Status filter
    document.querySelectorAll('input[name="status"]').forEach(r => {
        r.addEventListener('change', applyFilters);
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('teacherModal').classList.remove('open');
        document.body.style.overflow = '';
    });
    document.getElementById('teacherModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Gallery navigation
    document.getElementById('galleryPrev').addEventListener('click', () => navigateGallery(-1));
    document.getElementById('galleryNext').addEventListener('click', () => navigateGallery(1));

    // Keyboard nav for gallery
    document.addEventListener('keydown', function(e) {
        if (!document.getElementById('teacherModal').classList.contains('open')) return;
        if (e.key === 'ArrowLeft') navigateGallery(-1);
        if (e.key === 'ArrowRight') navigateGallery(1);
        if (e.key === 'Escape') {
            document.getElementById('teacherModal').classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Touch swipe for gallery
    let touchStartX = 0;
    let touchEndX = 0;
    document.getElementById('galleryMain').addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    document.getElementById('galleryMain').addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            navigateGallery(diff > 0 ? 1 : -1);
        }
    });

    // Add review
    document.getElementById('addReviewBtn').addEventListener('click', () => {
        document.getElementById('reviewModal').classList.add('open');
    });

    // Review modal
    document.getElementById('reviewCancel').addEventListener('click', () => {
        document.getElementById('reviewModal').classList.remove('open');
    });
    document.getElementById('reviewSubmit').addEventListener('click', submitReview);

    // Star rating
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            currentRating = parseInt(this.dataset.val);
            document.querySelectorAll('.star').forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.val) <= currentRating);
            });
            const labels = ['', '差', '一般', '不错', '很好', '完美'];
            document.getElementById('ratingText').textContent = labels[currentRating] + ' (' + currentRating + '星)';
        });
    });

    // Scrolled navbar
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });

    // Initialize filters and render
    updateTagFilters();
    applyFilters();
}

// Start
document.addEventListener('DOMContentLoaded', init);

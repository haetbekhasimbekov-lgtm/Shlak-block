/**
 * МОНОЛИТ-БЛОК — СКРИПТЫ ВЗАИМОДЕЙСТВИЯ, КАЛЬКУЛЯТОР И МУЛЬТИЯЗЫЧНОСТЬ (RU / UZ)
 */

let currentLang = 'ru';

document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    initMobileNav();
    initSavedLanguage();
});

/* ==========================================================
   ДАННЫЕ И ЛОГИКА КАЛЬКУЛЯТОРА
   ========================================================== */

const BLOCK_DATA = {
    wall4: {
        nameRu: 'Стеновой 4-х пустотный (390×190×190)',
        nameUz: 'Devoriy 4 bo\'shliqli (390×190×190)',
        price: 195, weight: 18.5, pallet: 72, volume: 0.014
    },
    wall2: {
        nameRu: 'Стеновой 2-х пустотный (390×190×190)',
        nameUz: 'Devoriy 2 bo\'shliqli (390×190×190)',
        price: 205, weight: 20.0, pallet: 72, volume: 0.014
    },
    solid: {
        nameRu: 'Полнотелый фундаментный (390×190×190)',
        nameUz: 'To\'la poydevorli (390×190×190)',
        price: 275, weight: 26.0, pallet: 60, volume: 0.014
    },
    partition: {
        nameRu: 'Перегородочный полублок (390×90×190)',
        nameUz: 'To\'siq yarim bloki (390×90×190)',
        price: 145, weight: 10.0, pallet: 144, volume: 0.0067
    },
    clay: {
        nameRu: 'Керамзитобетонный блок (390×190×190)',
        nameUz: 'Keramzit-beton blok (390×190×190)',
        price: 290, weight: 13.5, pallet: 72, volume: 0.014
    },
    decor: {
        nameRu: 'Декоративный рваный камень (390×190×190)',
        nameUz: 'Dekorativ yirtiq tosh (390×190×190)',
        price: 325, weight: 21.0, pallet: 72, volume: 0.014
    }
};

function getBlockName(key) {
    const b = BLOCK_DATA[key];
    if (!b) return key;
    return currentLang === 'uz' ? b.nameUz : b.nameRu;
}

let currentCalcMode = 'walls';
let selectedBlockType = 'wall4';
let lastCalcResult = null;

function initCalculator() {
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBlockType = btn.getAttribute('data-type');
            calculateBlocks();
        });
    });

    const inputs = [
        'inputLength', 'inputHeight', 'inputThickness', 'inputOpenings',
        'inputMargin', 'inputDirectQty'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateBlocks);
            el.addEventListener('change', calculateBlocks);
        }
    });

    const deliveryRadios = document.querySelectorAll('input[name="calcDelivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', calculateBlocks);
    });

    calculateBlocks();
}

function switchCalcMode(mode) {
    currentCalcMode = mode;
    const tabWalls = document.getElementById('tabWalls');
    const tabQty = document.getElementById('tabQty');
    const modeWalls = document.getElementById('modeWalls');
    const modeQty = document.getElementById('modeQty');

    if (mode === 'walls') {
        tabWalls.classList.add('active');
        tabQty.classList.remove('active');
        modeWalls.style.display = 'block';
        modeQty.style.display = 'none';
    } else {
        tabQty.classList.add('active');
        tabWalls.classList.remove('active');
        modeWalls.style.display = 'none';
        modeQty.style.display = 'block';
    }

    calculateBlocks();
}

function calculateBlocks() {
    const block = BLOCK_DATA[selectedBlockType] || BLOCK_DATA.wall4;
    let totalPieces = 0;

    if (currentCalcMode === 'walls') {
        const length = parseFloat(document.getElementById('inputLength')?.value) || 0;
        const height = parseFloat(document.getElementById('inputHeight')?.value) || 0;
        const thickness = document.getElementById('inputThickness')?.value || '190';
        const openings = parseFloat(document.getElementById('inputOpenings')?.value) || 0;
        const withMargin = document.getElementById('inputMargin')?.checked;

        const wallArea = Math.max(0, (length * height) - openings);

        let pcsPerM2 = 12.5;
        if (selectedBlockType === 'partition') {
            pcsPerM2 = 12.5;
        } else if (thickness === '390') {
            pcsPerM2 = 25.0;
        }

        let pieces = Math.ceil(wallArea * pcsPerM2);
        if (withMargin) {
            pieces = Math.ceil(pieces * 1.05);
        }
        totalPieces = pieces;
    } else {
        totalPieces = parseInt(document.getElementById('inputDirectQty')?.value) || 0;
    }

    if (totalPieces < 0) totalPieces = 0;

    const pallets = Math.ceil(totalPieces / block.pallet);
    const totalWeightKg = totalPieces * block.weight;
    const totalWeightTons = (totalWeightKg / 1000).toFixed(1);
    const totalVolumeM3 = (totalPieces * block.volume).toFixed(1);

    const isUz = currentLang === 'uz';

    let trucks = isUz ? '1 ta reys (5t)' : '1 рейс (5т)';
    if (totalWeightKg > 15000) {
        const trips = Math.ceil(totalWeightKg / 15000);
        trucks = isUz ? `${trips} ta reys (15t)` : `${trips} рейса (15т)`;
    } else if (totalWeightKg > 5000) {
        trucks = isUz ? '1 ta reys (10-12t)' : '1 рейс (10-12т)';
    }

    let discountPercent = 0;
    if (totalPieces >= 3000) {
        discountPercent = 5;
    } else if (totalPieces >= 1000) {
        discountPercent = 3;
    }

    const basePrice = totalPieces * block.price;
    const discountAmount = Math.round(basePrice * (discountPercent / 100));
    const finalPrice = basePrice - discountAmount;

    const resTotalBlocks = document.getElementById('resTotalBlocks');
    const resPallets = document.getElementById('resPallets');
    const resVolume = document.getElementById('resVolume');
    const resWeight = document.getElementById('resWeight');
    const resTrucks = document.getElementById('resTrucks');
    const resTotalPrice = document.getElementById('resTotalPrice');

    if (resTotalBlocks) resTotalBlocks.textContent = `${formatNumber(totalPieces)} ${isUz ? 'dona' : 'шт.'}`;
    if (resPallets) resPallets.textContent = `${pallets} ${isUz ? 'ta palet' : 'паллет'} (${block.pallet} ${isUz ? 'dona/poddon' : 'шт/поддон'})`;
    if (resVolume) resVolume.textContent = `${totalVolumeM3} ${isUz ? 'm³' : 'м³'}`;
    if (resWeight) resWeight.textContent = `${totalWeightTons} ${isUz ? 't' : 'т'}`;
    if (resTrucks) resTrucks.textContent = trucks;
    if (resTotalPrice) resTotalPrice.textContent = `${formatNumber(finalPrice)} ₸`;

    const discountBadge = document.getElementById('discountBadge');
    const savingsEl = document.getElementById('resSavings');

    if (discountPercent > 0) {
        if (discountBadge) {
            discountBadge.style.display = 'inline-block';
            discountBadge.textContent = isUz ? `Hajm uchun chegirma: ${discountPercent}%` : `Скидка за объем: ${discountPercent}%`;
        }
        if (savingsEl) {
            savingsEl.style.display = 'block';
            savingsEl.textContent = isUz ? `Sizning foydangiz: ${formatNumber(discountAmount)} ₸` : `Ваша выгода: ${formatNumber(discountAmount)} ₸`;
        }
    } else {
        if (discountBadge) discountBadge.style.display = 'none';
        if (savingsEl) savingsEl.style.display = 'none';
    }

    lastCalcResult = {
        blockKey: selectedBlockType,
        blockName: getBlockName(selectedBlockType),
        pieces: totalPieces,
        pallets: pallets,
        weight: totalWeightTons,
        price: finalPrice,
        discount: discountPercent
    };
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* ==========================================================
   ФИЛЬТРАЦИЯ КАТАЛОГА
   ========================================================== */

function filterCatalog(category, button) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/* ==========================================================
   FAQ АККОРДЕОН
   ========================================================== */

function toggleFaq(headerBtn) {
    const item = headerBtn.parentElement;
    const content = item.querySelector('.accordion-content');
    const isActive = item.classList.contains('active');

    document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-content').style.maxHeight = null;
    });

    if (!isActive) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
    }
}

/* ==========================================================
   МОДАЛЬНЫЕ ОКНА И ЗАКАЗЫ
   ========================================================== */

function openModal(type = 'default', customSubtitle = null) {
    const isUz = currentLang === 'uz';
    let title = isUz ? 'Tezkor ariza' : 'Быстрая заявка';
    let subtitle = isUz ? 'Telefon raqamingizni qoldiring, va sex texnologi 10 daqiqa ichida siz bilan bog\'lanadi.' : 'Оставьте номер телефона, и технолог цеха свяжется с вами в течение 10 минут.';

    if (type === 'consult') {
        title = isUz ? 'Tezkor maslahat' : 'Быстрая консультация';
        subtitle = isUz ? 'Telefon raqamingizni qoldiring, va mutaxassisimiz 10 daqiqada maslahat beradi.' : 'Оставьте номер телефона, и технолог цеха свяжется с вами в течение 10 минут.';
    } else if (type === 'delivery') {
        title = isUz ? 'Yetkazib berish narxini hisoblash' : 'Расчет стоимости доставки';
        subtitle = isUz ? 'Yetkazib berish manzilini ko\'rsating, va logist aniq narx va vaqtni hisoblab beradi:' : 'Укажите адрес доставки, и логист рассчитает точную стоимость и время прибытия:';
    } else if (type === 'callback') {
        title = isUz ? 'Qayta qo\'ng\'iroqqa buyurtma' : 'Заказ обратного звонка';
        subtitle = isUz ? 'Aloqa ma\'lumotlaringizni qoldiring, biz ish vaqtida qayta qo\'ng\'iroq qilamiz:' : 'Оставьте контактные данные, и мы перезвоним вам в ближайшее время:';
    } else if (typeof type === 'string' && type !== 'default') {
        title = type;
        if (customSubtitle) subtitle = customSubtitle;
    }

    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSubtitle').textContent = subtitle;
    document.getElementById('modalSummaryBox').style.display = 'none';
    document.getElementById('modalProductName').value = title;
    modal.classList.add('active');
}

function openOrderModal(productKeyOrName, price) {
    const isUz = currentLang === 'uz';
    const productName = BLOCK_DATA[productKeyOrName] ? getBlockName(productKeyOrName) : productKeyOrName;

    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = isUz ? 'Shlakobloklarga buyurtma' : 'Заказ шлакоблоков';
    document.getElementById('modalSubtitle').textContent = isUz 
        ? 'Yetkazib berishni hisoblash uchun kerakli miqdor yoki manzilni ko\'rsating:' 
        : 'Укажите желаемое количество или адрес для расчета доставки:';
    
    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = productName;
    document.getElementById('modalSummaryDetails').textContent = isUz
        ? `Baza narxi: ${price} ₸ / dona. Omborda mavjud.`
        : `Базовая стоимость: ${price} ₸ / шт. В наличии на складе.`;
    
    document.getElementById('modalProductName').value = productName;
    document.getElementById('modalOrderSummary').value = isUz
        ? `Mahsulot: ${productName}, Narx: ${price} tng.`
        : `Товар: ${productName}, Цена: ${price} тнг.`;
    modal.classList.add('active');
}

function orderFromCalculator() {
    if (!lastCalcResult) {
        calculateBlocks();
    }
    const isUz = currentLang === 'uz';
    const blockTitle = getBlockName(lastCalcResult.blockKey || selectedBlockType);

    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = isUz 
        ? 'Kalkulyatordan narxni mahkamlash' 
        : 'Фиксация цены из калькулятора';
    document.getElementById('modalSubtitle').textContent = isUz
        ? 'Hisobingiz tayyor! Chegirma va bloklar zaxirasini raqamingizga biriktiring:'
        : 'Ваш расчет готов! Закрепите скидку и бронь блоков за вашим номером:';

    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = blockTitle;
    document.getElementById('modalSummaryDetails').textContent = isUz
        ? `Hajm: ${formatNumber(lastCalcResult.pieces)} dona (${lastCalcResult.pallets} ta palet, ~${lastCalcResult.weight} t). Chegirma bilan jami: ${formatNumber(lastCalcResult.price)} ₸`
        : `Объем: ${formatNumber(lastCalcResult.pieces)} шт. (${lastCalcResult.pallets} паллет, ~${lastCalcResult.weight} т). Итого со скидкой: ${formatNumber(lastCalcResult.price)} ₸`;

    document.getElementById('modalProductName').value = isUz ? 'Kalkulyatordan buyurtma' : 'Заказ из калькулятора';
    document.getElementById('modalOrderSummary').value = 
        `Blok: ${blockTitle}, Dona: ${lastCalcResult.pieces}, Palet: ${lastCalcResult.pallets}, Summa: ${lastCalcResult.price} ₸`;

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

/* ==========================================================
   ОБРАБОТКА ФОРМ И УВЕДОМЛЕНИЙ
   ========================================================== */

function handleModalSubmit(e) {
    e.preventDefault();
    const isUz = currentLang === 'uz';
    const name = document.getElementById('modalName').value;
    const phone = document.getElementById('modalPhone').value;

    closeModal();
    showToast(
        isUz ? 'Ariza muvaffaqiyatli qabul qilindi!' : 'Заявка успешно принята!',
        isUz ? `Rahmat, ${name}! Sex menejeri tasdiqlash uchun ${phone} raqamiga bog\'lanadi.` : `Спасибо, ${name}! Менеджер цеха свяжется с вами по номеру ${phone} для подтверждения.`
    );
    e.target.reset();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const isUz = currentLang === 'uz';
    const name = document.getElementById('leadName').value;
    const phone = document.getElementById('leadPhone').value;
    const product = document.getElementById('leadProduct').value;

    showToast(
        isUz ? 'Ariza ro\'yxatga olindi!' : 'Заявка зарегистрирована!',
        isUz ? `Rahmat, ${name}! «${product}» bo\'yicha hisob-kitob sotuv bo\'limiga yuborildi.` : `Спасибо, ${name}! Расчет по продукции «${product}» отправлен в отдел сбыта.`
    );
    e.target.reset();
}

function showToast(title, message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

/* ==========================================================
   МОБИЛЬНОЕ МЕНЮ
   ========================================================== */

function initMobileNav() {
    const burger = document.getElementById('burgerBtn');
    const nav = document.getElementById('mainNav');

    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('open');
            burger.classList.toggle('open');
            if (nav.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                burger.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }
}

/* ==========================================================
   SCROLL REVEAL ANIMATIONS
   ========================================================== */
function initScrollAnimations() {
    const leftElements = document.querySelectorAll('.hero__content, .delivery-info, .contacts-info-card');
    leftElements.forEach(el => { el.classList.add('reveal', 'reveal-left'); });

    const rightElements = document.querySelectorAll('.hero__card-preview, .delivery-fleet, .contact-form-card');
    rightElements.forEach(el => { el.classList.add('reveal', 'reveal-right'); });

    const bottomElements = document.querySelectorAll('.section-header, .feature-card, .product-card, .step-card, .review-card, .accordion-item');
    bottomElements.forEach((el, index) => { 
        el.classList.add('reveal', 'reveal-bottom');
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
    });

    const scaleElements = document.querySelectorAll('.calculator-wrapper, .process-banner');
    scaleElements.forEach(el => { el.classList.add('reveal', 'reveal-scale'); });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

/* ==========================================================
   ГАЛЕРЕЯ И LIGHTBOX
   ========================================================== */

function filterGallery(category, btn) {
    document.querySelectorAll('.gallery-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        const cat = item.getAttribute('data-gallery-cat');
        if (category === 'all' || cat === category) {
            item.classList.remove('gallery-hidden');
        } else {
            item.classList.add('gallery-hidden');
        }
    });
}

const GALLERY_DATA = [
    {
        type: 'image',
        src: 'assets/images/gallery_house.jpg',
        captionRu: 'Коттедж 200 м² — 4 200 стеновых блоков М75',
        captionUz: 'Kottedj 200 m² — 4 200 dona M75 devoriy blok'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_garage.jpg',
        captionRu: 'Гараж-мастерская 18×9 м — 1 800 блоков 4-х пустотных',
        captionUz: 'Garaj-ustaxona 18×9 m — 1 800 dona 4 bo\'shliqli blok'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_factory.jpg',
        captionRu: 'Наш цех — автоматизированная вибропрессовая линия, 12 000 блоков/сутки',
        captionUz: 'Bizning sex — avtomatlashtirilgan vibropress liniyasi, 12 000 blok/sutka'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_warehouse.jpg',
        captionRu: 'Логистический склад 1 200 м² — 14 000 полнотелых блоков М100',
        captionUz: 'Logistika ombori 1 200 m² — 14 000 dona to\'la M100 blok'
    },
    {
        type: 'cert',
        icon: '📋',
        titleRu: 'Паспорт качества ГОСТ 6133-99',
        titleUz: 'GOST 6133-99 sifat pasporti',
        descRu: 'Лабораторный протокол испытания на прочность, морозостойкость и геометрию каждой партии.',
        descUz: 'Har bir partiya uchun mustahkamlik, sovuqqa chidamlilik va geometriyaga sinov laboratoriya bayonnomasi.',
        details: [
            { labelRu: 'Марка прочности', labelUz: 'Mustahkamlik markasi', valueRu: 'М75 — М100', valueUz: 'M75 — M100' },
            { labelRu: 'Морозостойкость', labelUz: 'Sovuqqa chidamlilik', valueRu: 'F50 (50 циклов)', valueUz: 'F50 (50 tsikl)' },
            { labelRu: 'Геометрия (откл.)', labelUz: 'Geometriya (og\'ish)', valueRu: '±1 мм по ГОСТ', valueUz: '±1 mm GOST bo\'yicha' },
            { labelRu: 'Выдан', labelUz: 'Berilgan', valueRu: 'ОТК завода №1', valueUz: 'Zavod OTK №1' }
        ]
    },
    {
        type: 'cert',
        icon: '🏆',
        titleRu: 'Сертификат соответствия',
        titleUz: 'Muvofiqlik sertifikati',
        descRu: 'Продукция прошла добровольную сертификацию в независимой аккредитованной лаборатории.',
        descUz: 'Mahsulot mustaqil akkreditatsiyalangan laboratoriyada ixtiyoriy sertifikatsiyadan o\'tdi.',
        details: [
            { labelRu: 'Стандарт', labelUz: 'Standart', valueRu: 'ГОСТ 6133-99', valueUz: 'GOST 6133-99' },
            { labelRu: 'Область', labelUz: 'Soha', valueRu: 'Стеновые блоки', valueUz: 'Devoriy bloklar' },
            { labelRu: 'Статус', labelUz: 'Status', valueRu: '✓ Действующий', valueUz: '✓ Amalda' },
            { labelRu: 'Орган', labelUz: 'Organ', valueRu: 'Независимая лаб.', valueUz: 'Mustaqil laboratoriya' }
        ]
    }
];

let currentLightboxIdx = 0;

function openLightbox(idx) {
    currentLightboxIdx = idx;
    renderLightbox();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function lightboxNav(dir) {
    const visibleItems = getVisibleGalleryItems();
    const currentPos = visibleItems.indexOf(currentLightboxIdx);
    const newPos = (currentPos + dir + visibleItems.length) % visibleItems.length;
    currentLightboxIdx = visibleItems[newPos];
    renderLightbox();
}

function getVisibleGalleryItems() {
    const items = document.querySelectorAll('.gallery-item:not(.gallery-hidden)');
    const idxs = [];
    items.forEach(item => {
        const onclick = item.getAttribute('onclick');
        const match = onclick && onclick.match(/openLightbox\((\d+)\)/);
        if (match) idxs.push(parseInt(match[1]));
    });
    return idxs;
}

function renderLightbox() {
    const data = GALLERY_DATA[currentLightboxIdx];
    const imgEl = document.getElementById('lightboxImg');
    const certEl = document.getElementById('lightboxCert');
    const captionEl = document.getElementById('lightboxCaption');
    const counterEl = document.getElementById('lightboxCounter');

    const lang = currentLang;
    const visibleItems = getVisibleGalleryItems();
    const pos = visibleItems.indexOf(currentLightboxIdx);

    counterEl.textContent = `${pos + 1} / ${visibleItems.length}`;

    if (data.type === 'image') {
        imgEl.src = data.src;
        imgEl.alt = lang === 'ru' ? data.captionRu : data.captionUz;
        imgEl.style.display = 'block';
        certEl.style.display = 'none';
        captionEl.textContent = lang === 'ru' ? data.captionRu : data.captionUz;
    } else {
        imgEl.style.display = 'none';
        certEl.style.display = 'block';
        captionEl.textContent = '';

        const detailsHtml = data.details.map(d => `
            <div class="cert-detail-row">
                <span>${lang === 'ru' ? d.labelRu : d.labelUz}</span>
                <strong>${lang === 'ru' ? d.valueRu : d.valueUz}</strong>
            </div>
        `).join('');

        certEl.innerHTML = `
            <div class="cert-icon-big">${data.icon}</div>
            <h3>${lang === 'ru' ? data.titleRu : data.titleUz}</h3>
            <p>${lang === 'ru' ? data.descRu : data.descUz}</p>
            <div class="lightbox__cert-details">${detailsHtml}</div>
        `;
    }
}

document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') lightboxNav(1);
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'Escape') closeLightbox();
});

/* ==========================================================
   ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (UZ / RU) — СЛОВАРЬ И ЛОГИКА
   ========================================================== */

const TRANSLATIONS = {
    ru: {
        "top-address": "📍 Промзона, Заводской проезд, склад №4 (Пн–Сб: 08:00–20:00)",
        "top-stock": "<span class=\"pulse-dot\"></span> <span>В наличии на складе: <strong>65 000+ блоков</strong> готовых к отгрузке</span>",
        "top-callback": "Заказать звонок",
        "logo-title": "МОНОЛИТ-БЛОК",
        "logo-subtitle": "ПРОИЗВОДСТВЕННЫЙ ЦЕХ №1",
        "nav-catalog": "Продукция",
        "nav-calc": "Калькулятор",
        "nav-advantages": "Преимущества",
        "nav-production": "Производство",
        "nav-delivery": "Доставка",
        "nav-reviews": "Отзывы",
        "nav-contacts": "Контакты",
        "header-btn-calc": "Рассчитать цену",
        "hero-badge": "<span class=\"badge__dot\"></span> Прямой производитель • Без посредников",
        "hero-title": "Производство шлакоблоков ГОСТ <br><span class=\"text-gradient\">с доставкой манипулятором</span> в день заказа",
        "hero-desc": "Стеновые, перегородочные и усиленные блоки марки М75–М100 с идеальной геометрией (отклонение до 1 мм). Пропарочная камера полного цикла, набор марочной прочности 100%. Оплата по факту выгрузки на объекте.",
        "hero-btn-calc": "<span>Рассчитать стоимость онлайн</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "hero-btn-catalog": "Смотреть каталог и цены",
        "hero-stat1-num": "от 190 ₸",
        "hero-stat1-lbl": "Оптовая цена за штуку",
        "hero-stat2-lbl": "Сертифицированная прочность",
        "hero-stat3-num": "до 12 000 шт.",
        "hero-stat3-lbl": "Суточная мощность цеха",
        "hero-stat4-lbl": "Оплата только при получении",
        "hero-preview-tag": "В наличии 65 000 шт.",
        "hero-preview-title": "Стеновой 4-х пустотный М75",
        "hero-preview-dims": "390 × 190 × 190 мм • Вес: 18.5 кг",
        "hero-preview-curprice": "195 ₸ / шт.",
        "hero-preview-order": "Заказать",
        "adv-tag": "ПОЧЕМУ ВЫБИРАЮТ НАШ ЦЕХ",
        "adv-title": "Качество, за которое мы отвечаем репутацией",
        "adv-subtitle": "Мы не гаражное производство — работаем на автоматизированной линии с пропарочными камерами и собственной лабораторией.",
        "adv-c1-title": "Идеальная геометрия (±1 мм)",
        "adv-c1-desc": "Формовка на вибропрессе с усилием 160 тонн. Ровные грани экономят до 40% кладочного раствора и ускоряют работу каменщиков в 2 раза.",
        "adv-c2-title": "Пропарочная камера 70°C",
        "adv-c2-desc": "Блоки набирают 75% проектной прочности уже через 24 часа в горячем пару. Они не осыпаются, не крошатся и готовы к кладке сразу после доставки.",
        "adv-c3-title": "Цемент марки ПЦ-500 Д0",
        "adv-c3-desc": "Используем только чистый цемент без шлаковых примесей и гранитный отсев фракции 0-5 мм. Сертификаты и паспорт качества на каждую партию.",
        "adv-c4-title": "Свой автопарк манипуляторов",
        "adv-c4-desc": "5 собственных грузовиков с гидроманипуляторами (г/п стрелы до 3 т, кузова 10-20 т). Аккуратная разгрузка прямо к фундаменту вашего объекта.",
        "adv-c5-title": "Честный объем и без боя",
        "adv-c5-desc": "Упаковка на деревянные поддоны со стрейч-пленкой и стреппинг-лентой. Если при разгрузке разобьется хоть один блок — меняем за наш счет.",
        "adv-c6-title": "Оплата по факту",
        "adv-c6-desc": "Никаких скрытых платежей или предоплат для частных лиц. Проверяете качество и количество на месте, затем оплачиваете наличными или картой.",
        "calc-badge": "ТОЧНЫЙ РАСЧЕТ ЗА 30 СЕКУНД",
        "calc-title": "Калькулятор расчета шлакоблоков и стоимости",
        "calc-subtitle": "Рассчитайте точное количество блоков, число поддонов, вес для доставки и итоговую сумму со скидкой от объема.",
        "calc-step1-lbl": "1. Выберите тип блока:",
        "calc-t1-title": "Стеновой 4-х пустотный",
        "calc-t1-sub": "390×190×190 мм • 195 ₸/шт",
        "calc-t2-title": "Стеновой 2-х пустотный",
        "calc-t2-sub": "390×190×190 мм • 205 ₸/шт",
        "calc-t3-title": "Полнотелый усиленный",
        "calc-t3-sub": "390×190×190 мм • 275 ₸/шт",
        "calc-t4-title": "Перегородочный полублок",
        "calc-t4-sub": "390×90×190 мм • 145 ₸/шт",
        "calc-step2-lbl": "2. Способ расчета:",
        "calc-tab-walls": "По размерам стен (здания)",
        "calc-tab-qty": "По количеству штук",
        "calc-len-lbl": "Общая длина стен (м):",
        "calc-len-hint": "Например, дом 10×10 м = 40 м",
        "calc-h-lbl": "Высота стен (м):",
        "calc-h-hint": "Стандартно 2.8 - 3.0 м",
        "calc-thick-lbl": "Толщина кладки:",
        "calc-thick-opt1": "В полблока (190 мм) — для хозпостроек, гаражей, заборов",
        "calc-thick-opt2": "В 1 блок (390 мм) — для теплых домов, складов",
        "calc-open-lbl": "Площадь окон и дверей (м²):",
        "calc-open-hint": "Вычитается из объема стен",
        "calc-margin-lbl": "Запас 5% на подрезку и бой (рекомендуется мастерами)",
        "calc-qty-lbl": "Необходимое количество блоков (шт):",
        "calc-qty-hint": "Укажите нужное вам число блоков",
        "calc-step3-lbl": "3. Доставка:",
        "calc-del-opt1-title": "Манипулятор цеха (с выгрузкой)",
        "calc-del-opt1-sub": "По городу и области, точный расчет логистом",
        "calc-del-opt2-title": "Самовывоз со склада цеха",
        "calc-del-opt2-sub": "Бесплатная погрузка погрузчиком на поддонах",
        "calc-res-title": "Смета и параметры заказа",
        "calc-res-lbl-blocks": "Количество блоков:",
        "calc-res-lbl-pallets": "Количество поддонов:",
        "calc-res-lbl-volume": "Общий объем кладки:",
        "calc-res-lbl-weight": "Примерный вес груза:",
        "calc-res-lbl-trucks": "Потребность транспорта:",
        "calc-res-lbl-total": "Итоговая стоимость:",
        "calc-res-btn": "<span>Зафиксировать цену со скидкой</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "calc-res-note": "🔒 Фиксация цены действует 14 дней. Никакой предоплаты!",
        "cat-tag": "АССОРТИМЕНТ ПРОДУКЦИИ",
        "cat-title": "Каталог шлакоблоков от производителя",
        "cat-subtitle": "Вся продукция изготовлена методом полусухого объемного вибропрессования в строгом соответствии с ГОСТ 6133-99.",
        "cat-filter-all": "Все виды блоков",
        "cat-filter-wall": "Стеновые (390×190×190)",
        "cat-filter-part": "Перегородочные (390×90×190)",
        "cat-filter-heavy": "Фундаментные и усиленные",
        "btn-order": "Заказать",
        "card1-badge": "ХИТ ПРОДАЖ",
        "card1-title": "Шлакоблок стеновой 4-х пустотный",
        "card2-badge": "ОПТИМАЛЬНЫЙ",
        "card2-title": "Шлакоблок стеновой 2-х пустотный",
        "card3-badge": "ПОВЫШЕННАЯ ПРОЧНОСТЬ",
        "card3-title": "Шлакоблок полнотелый (фундаментный)",
        "card4-badge": "ДЛЯ ПЕРЕГОРОДОК",
        "card4-title": "Шлакоблок перегородочный (полублок)",
        "card5-badge": "ТЕПЛЫЙ",
        "card5-title": "Керамзитобетонный блок теплый",
        "card6-badge": "ЭСТЕТИКА",
        "card6-title": "Декоративный блок «Рваный камень»",
        "spec-lbl-size": "Размер:",
        "spec-lbl-strength": "Марка прочности:",
        "spec-lbl-hollow": "Пустотность:",
        "spec-lbl-weight": "Вес блока:",
        "spec-lbl-pallet": "На поддоне:",
        "spec-lbl-frost": "Морозостойкость:",
        "spec-lbl-sound": "Шумоизоляция:",
        "spec-lbl-thermal": "Теплопроводность:",
        "spec-lbl-eco": "Экологичность:",
        "spec-lbl-texture": "Фактура:",
        "spec-lbl-purpose": "Назначение:",
        "spec-lbl-colors": "Цвета:",
        "spec-v-hollow30": "30% (теплосберегающий)",
        "spec-v-hollow40": "40% (толстые стенки)",
        "spec-v-hollow0": "0% (монолитный)",
        "spec-v-hollow2": "Пустотелый 2-х щелевой",
        "spec-v-pallet72": "72 шт. (1 332 кг)",
        "spec-v-pallet72-2": "72 шт. (1 440 кг)",
        "spec-v-pallet60": "60 шт. (1 560 кг)",
        "spec-v-pallet144": "144 шт. (1 440 кг)",
        "spec-v-pallet72-c": "72 шт. (972 кг)",
        "spec-v-frost50": "F50 (от 50 циклов)",
        "spec-v-sound-hi": "Высокая (до 48 дБ)",
        "spec-v-eco-clay": "100% природная глина",
        "spec-v-texture-stone": "Колотая лицевая грань",
        "spec-v-purp-found": "Цоколи, фундаменты, опоры",
        "spec-v-purp-fence": "Заборы, цоколи, фасады",
        "spec-v-colors": "Серый, графит, шоколад",
        "unit-pallet-14040": "/ шт. (14040 ₸/поддон)",
        "unit-pallet-14760": "/ шт. (14760 ₸/поддон)",
        "unit-pallet-16500": "/ шт. (16500 ₸/поддон)",
        "unit-pallet-20880": "/ шт. (20880 ₸/поддон)",
        "unit-pallet-23400": "/ шт. (23400 ₸/поддон)",
        "table-tag": "ТЕХНИЧЕСКИЕ ДАННЫЕ",
        "table-title": "Сравнение характеристик блоков по ГОСТ 6133-99",
        "table-subtitle": "Официальные показатели лабораторных испытаний каждой партии нашего завода.",
        "th-type": "Тип блока",
        "th-dims": "Размеры (мм)",
        "th-hollow": "Пустотность",
        "th-strength": "Марка прочности",
        "th-frost": "Морозостойкость",
        "th-weight": "Вес (кг)",
        "th-pallet": "В поддоне (шт)",
        "tb-row1-type": "Стеновой 4-х пустотный",
        "tb-row2-type": "Стеновой 2-х пустотный",
        "tb-row3-type": "Полнотелый фундаментный",
        "tb-row3-hollow": "0% (сплошной)",
        "tb-row4-type": "Перегородочный (полублок)",
        "tb-row5-type": "Керамзитобетонный стеновой",
        "prod-tag": "ТЕХНОЛОГИЯ ЦЕХА",
        "prod-title": "Как мы производим надежные блоки",
        "prod-subtitle": "От правильной технологии вибропрессования зависит, простоит ли ваш дом 70 лет без трещин.",
        "prod-banner-badge": "ЦЕХ ПОЛНОГО ЦИКЛА",
        "prod-banner-title": "Автоматизированная вибропрессовальная линия «BLOCKMASTER»",
        "prod-banner-desc": "Компьютерное дозирование цемента, воды и фракционного наполнителя исключает человеческий фактор.",
        "prod-step1-title": "Подготовка сырья",
        "prod-step1-desc": "Отмытый гранитный отсев 0-5 мм и портландцемент М500. Жесткая смесь без глины и мусора.",
        "prod-step2-title": "Вибропрессование",
        "prod-step2-desc": "Прессование в матрице под давлением 160 атмосфер с высокочастотной вибрацией для максимальной плотности.",
        "prod-step3-title": "Пропарочная камера",
        "prod-step3-desc": "Термовлажностная обработка паром при 70°C. Блок набирает марочную прочность за 24 часа вместо 28 дней.",
        "prod-step4-title": "Контроль ОТК и склад",
        "prod-step4-desc": "Замер диагоналей, тест на прессе, упаковка на европоддоны в стрейч-пленку для бережной доставки.",
        "del-tag": "СОБСТВЕННЫЙ АВТОПАРК",
        "del-title": "Быстрая доставка манипулятором в день заказа",
        "del-subtitle": "Разгрузим поддоны прямо на вашей стройплощадке или поднимем на перекрытия второго этажа.",
        "del-perk1-title": "Манипуляторы 5т, 10т и 20т",
        "del-perk1-desc": "Подберем машину под узкие улицы СНТ или крупные строительные объекты.",
        "del-perk2-title": "Бережная выгрузка стрелой",
        "del-perk2-desc": "Никаких сбросов самосвалом — блоки не бьются и не царапаются.",
        "del-perk3-title": "Самовывоз 6 дней в неделю",
        "del-perk3-desc": "Бесплатная и быстрая погрузка вилочным автопогрузчиком за 15 минут.",
        "del-cta-text": "Узнайте точную стоимость доставки до вашего населенного пункта:",
        "del-cta-btn": "Рассчитать доставку",
        "truck1-badge": "МАЛЫЙ МАНИПУЛЯТОР",
        "truck1-title": "КАМАЗ / ISUZU (до 5 тонн)",
        "truck1-cap": "Вместимость: <strong>до 250 блоков (3–4 поддона)</strong>",
        "truck1-desc": "Идеально для пристроек, гаражей, заборов и узких проездов.",
        "truck2-badge": "САМЫЙ ВОСТРЕБОВАННЫЙ",
        "truck2-title": "МАЗ / КАМАЗ (до 10–12 тонн)",
        "truck2-cap": "Вместимость: <strong>до 650 блоков (8–9 поддонов)</strong>",
        "truck2-desc": "Оптимален для строительства 1-го этажа дома или хозблока.",
        "truck3-badge": "ТЯЖЕЛЫЙ МАНИПУЛЯТОР",
        "truck3-title": "ДЛИННОМЕР (до 20–25 тонн)",
        "truck3-cap": "Вместимость: <strong>до 1 300 блоков (18 поддонов)</strong>",
        "truck3-desc": "Для масштабных строительств и оптовых поставок по минимальному тарифу.",
        "rev-tag": "РЕАЛЬНЫЙ ОПЫТ",
        "rev-title": "Что говорят строители и заказчики",
        "rev-subtitle": "Более 1 200 построенных объектов за 7 лет работы цеха.",
        "rev1-author": "Алексей Новиков",
        "rev1-role": "Прораб, строительная бригада",
        "rev1-text": "«Берем в этом цехе уже третий сезон подряд. Главное преимущество — геометрия. Швы получаются ровные, до 8 мм, раствора уходит минимум. Блоки крепкие, не ломаются при переноске. Водитель манипулятора мастерски поставил поддоны прямо в периметр фундамента.»",
        "rev1-object": "Объект: Коттедж 160 м² (2 800 блоков)",
        "rev2-author": "Бахром Каримов",
        "rev2-role": "Частный застройщик",
        "rev2-text": "«Строил гараж с мансардой. Позвонил в 9 утра, менеджер помог посчитать по размерам через калькулятор. В 14:00 машина уже разгружалась у меня на участке. Оплатил водителю после осмотра. Блоки свежие, звонкие при постукивании, прочность отличная!»",
        "rev2-object": "Объект: Гараж 7х9 м (950 блоков)",
        "rev3-author": "Сергей Васильев",
        "rev3-role": "Генподрядчик складского комплекса",
        "rev3-text": "«Заказывали крупную партию полнотелых и 4-х пустотных блоков (14 000 штук). Цех выдержал график день в день. Приложили паспорта качества и протоколы испытаний. Никакого боя в поддонах. Рекомендую как надежного прямого производителя.»",
        "rev3-object": "Объект: Ангар-склад 450 м² (14 000 блоков)",
        "faq-tag": "ВОПРОСЫ И ОТВЕТЫ",
        "faq-title": "Часто задаваемые вопросы",
        "faq-subtitle": "Все, что нужно знать перед заказом партии шлакоблоков.",
        "faq-q1": "Сколько шлакоблоков помещается в 1 м² и 1 м³ кладки?",
        "faq-a1": "При стандартном размере 390×190×190 мм и толщине шва 10 мм:<br>• В 1 м² стены толщиной в полблока (19 см) входит <strong>12.5 блоков</strong>.<br>• В 1 м² стены толщиной в целый блок (39 см) входит <strong>25 блоков</strong>.<br>• В 1 м³ сплошной кладки входит ровно <strong>62.5 блока</strong>.",
        "faq-q2": "Сколько блоков вмещает один деревянный поддон?",
        "faq-a2": "На стандартный европоддон укладывается <strong>72 штуки</strong> стеновых блоков (вес поддона около 1.33 тонны) либо <strong>144 штуки</strong> перегородочных полублоков. Полнотелые фундаментные блоки укладываются по <strong>60 штук</strong> из-за большего веса.",
        "faq-q3": "Как отличить заводской пропаренный блок от гаражного кустарного?",
        "faq-a3": "Кустарные блоки сушат на открытом солнце: они светлые, края крошатся пальцами, геометрия кривая (перепад до 1–2 см), при постукивании глухой звук. Заводской блок из камеры имеет равномерный серый цвет, четкие прямые углы, при ударе молотком издает звонкий звук и не колется.",
        "faq-q4": "Нужна ли предоплата и как происходит оплата?",
        "faq-a4": "Для физических лиц при заказе стандартных объемов <strong>предоплата не требуется</strong>! Вы заказываете доставку, водитель привозит поддоны, вы проверяете качество и рассчитываетесь на месте наличными или переводом. Для юридических лиц доступна безналичная оплата с НДС/без НДС.",
        "faq-q5": "Предоставляются ли скидки на опт?",
        "faq-a5": "Да! При заказе от 1 000 штук скидка 3%, от 3 000 штук — 5%, от 5 000 штук — специальная цена и льготный тариф на манипулятор.",
        "cnt-form-badge": "ПЕРСОНАЛЬНЫЙ РАСЧЕТ",
        "cnt-form-title": "Оставьте заявку на поставку блоков",
        "cnt-form-desc": "Менеджер цеха свяжется с вами в течение 10 минут, уточнит наличие и рассчитает доставку до вашего объекта.",
        "cnt-lbl-name": "Ваше имя:",
        "cnt-ph-name": "Иван Петров",
        "cnt-lbl-phone": "Номер телефона:",
        "cnt-lbl-prod": "Что вас интересует:",
        "cnt-opt-wall4": "Стеновые 4-х пустотные (390×190×190)",
        "cnt-opt-wall2": "Стеновые 2-х пустотные (390×190×190)",
        "cnt-opt-solid": "Полнотелые фундаментные (390×190×190)",
        "cnt-opt-part": "Перегородочные полублоки (390×90×190)",
        "cnt-opt-clay": "Керамзитобетонные блоки",
        "cnt-opt-all": "Нужен полный расчет по проекту",
        "cnt-lbl-addr": "Адрес или район доставки (или самовывоз):",
        "cnt-ph-addr": "Например: п. Сосновый, ул. Лесная 12",
        "cnt-btn-submit": "<span>Получить расчет и зафиксировать скидку</span>",
        "cnt-privacy": "Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Мы не рассылаем спам.",
        "cnt-info-tag": "ЦЕХ И СКЛАД ГОТОВОЙ ПРОДУКЦИИ",
        "cnt-info-title": "Приезжайте к нам на производство",
        "cnt-info-desc": "Вы можете лично осмотреть образцы блоков, проверить геометрию штангенциркулем и оценить прочность перед покупкой.",
        "cnt-lbl-work-addr": "Адрес производства и склада:",
        "cnt-val-work-addr": "Промзона, Заводской проезд, склад №4",
        "cnt-lbl-hours": "График отгрузки и работы:",
        "cnt-val-hours": "Пн – Сб: с 08:00 до 20:00<br>Вс: по предварительной договоренности",
        "cnt-lbl-sales-phone": "Прямой телефон отдела сбыта:",
        "cnt-phone-multi": "(многоканальный)",
        "cnt-lbl-messengers": "Мессенджеры для быстрой связи:",
        "cnt-map-title": "Цех шлакоблоков «МОНОЛИТ-БЛОК»",
        "cnt-map-desc": "Удобный подъезд для длинномеров и газелей, бетонная площадка погрузки",
        "ft-about": "Прямой производитель стеновых и перегородочных вибропрессованных шлакоблоков по ГОСТ 6133-99. Надежные поставки для частного и коммерческого строительства.",
        "ft-copy": "© 2026 Завод «МОНОЛИТ-БЛОК». Все права защищены.",
        "ft-h-prod": "Продукция",
        "ft-p1": "Стеновые 4-х пустотные",
        "ft-p2": "Стеновые 2-х пустотные",
        "ft-p3": "Полнотелые фундаментные",
        "ft-p4": "Перегородочные полублоки",
        "ft-p5": "Керамзитобетонные блоки",
        "ft-p6": "Декоративные колотые блоки",
        "ft-h-nav": "Навигация",
        "ft-n1": "Калькулятор расчета",
        "ft-n2": "Преимущества цеха",
        "ft-n3": "Технология и ГОСТ",
        "ft-n4": "Условия доставки",
        "ft-n5": "Отзывы клиентов",
        "ft-n6": "Склад и контакты",
        "ft-h-sales": "Служба сбыта",
        "ft-lbl-phone": "Телефон:",
        "ft-lbl-email": "Почта:",
        "ft-lbl-addr": "Адрес:",
        "ft-val-addr": "Промзона, Заводской проезд, 4",
        "ft-btn-call": "Заказать звонок",
        "modal-badge": "БЫСТРЫЙ ЗАКАЗ",
        "modal-title": "Оформление заявки",
        "modal-subtitle": "Заполните контактные данные, и мы свяжемся с вами в течение 10 минут для подтверждения.",
        "modal-lbl-name": "Ваше имя:",
        "modal-ph-name": "Иван",
        "modal-lbl-phone": "Контактный телефон:",
        "modal-lbl-comment": "Комментарий / Адрес доставки (необязательно):",
        "modal-ph-comment": "Укажите район доставки или желаемую дату",
        "modal-btn": "<span>Подтвердить заявку</span>",
        "modal-privacy": "Оплата только после получения и проверки товара на объекте."
},
    uz: {
        "top-address": "📍 Sanoat zonasi, Zavod yo'li, 4-ombor (Dush–Shan: 08:00–20:00)",
        "top-stock": "<span class=\"pulse-dot\"></span> <span>Omborda mavjud: <strong>65 000+ blok</strong> jo'natishga tayyor</span>",
        "top-callback": "Qo'ng'iroq buyurtma qilish",
        "logo-title": "MONOLIT-BLOK",
        "logo-subtitle": "1-SONLI ISHLAB CHIQARISH SEXI",
        "nav-catalog": "Mahsulotlar",
        "nav-calc": "Kalkulyator",
        "nav-advantages": "Afzalliklar",
        "nav-production": "Ishlab chiqarish",
        "nav-delivery": "Yetkazib berish",
        "nav-reviews": "Sharhlar",
        "nav-contacts": "Kontaktlar",
        "header-btn-calc": "Narxni hisoblash",
        "hero-badge": "<span class=\"badge__dot\"></span> To'g'ridan-to'g'ri ishlab chiqaruvchi • Vositachilarsiz",
        "hero-title": "GOST shlakobloklari ishlab chiqarish <br><span class=\"text-gradient\">manipulyator bilan yetkazib berish</span> buyurtma kunida",
        "hero-desc": "M75–M100 markali, mukammal geometriyaga ega (og'ish 1 mm gacha) devoriy, to'siq va mustahkamlangan bloklar. To'liq tsiklli bug'lash kamerasi, 100% loyiha mustahkamligi. To'lov ob'ektda yuk tushirilgandan so'ng.",
        "hero-btn-calc": "<span>Narxni onlayn hisoblash</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "hero-btn-catalog": "Katalog va narxlarni ko'rish",
        "hero-stat1-num": "190 ₸ dan",
        "hero-stat1-lbl": "Ulgurji narx (dona)",
        "hero-stat2-lbl": "Sertifikatlangan mustahkamlik",
        "hero-stat3-num": "12 000 donagacha",
        "hero-stat3-lbl": "Sex kunlik quvvati",
        "hero-stat4-lbl": "To'lov faqat qabul qilinganda",
        "hero-preview-tag": "Omborda 65 000 dona mavjud",
        "hero-preview-title": "Devoriy 4 bo'shliqli M75",
        "hero-preview-dims": "390 × 190 × 190 mm • Og'irligi: 18.5 kg",
        "hero-preview-curprice": "195 ₸ / dona",
        "hero-preview-order": "Buyurtma berish",
        "adv-tag": "NEGA BIZNING SEXNI TANLASHADI",
        "adv-title": "Obro'yimiz bilan kafolatlaydigan sifat",
        "adv-subtitle": "Biz qo'lbola ishlab chiqarish emasmiz — bug'lash kameralari va o'z laboratoriyasiga ega avtomatlashtirilgan liniyada ishlaymiz.",
        "adv-c1-title": "Mukammal geometriya (±1 mm)",
        "adv-c1-desc": "160 tonnalik quvvat bilan vibropressda qoliplash. Tekis qirralar qorishma sarfini 40% tejaydi va g'isht teruvchilar ishini 2 baravar tezlashtiradi.",
        "adv-c2-title": "70°C bug'lash kamerasi",
        "adv-c2-desc": "Bloklar issiq bug'da 24 soat ichida loyiha mustahkamligining 75% ini oladi. Uvalanmaydi, uqalanmaydi va yetkazilgandan so'ng darhol terishga tayyor.",
        "adv-c3-title": "PTs-500 D0 markali sement",
        "adv-c3-desc": "Faqat shlak aralashmasiz toza sement va 0-5 mm fraktsiyali granit tosh ishlatamiz. Har bir partiyaga sifat pasporti va sertifikatlar beriladi.",
        "adv-c4-title": "O'z manipulyatorlar parki",
        "adv-c4-desc": "Gidromanipulyatorli 5 ta o'z yuk mashinamiz bor (strelasi 3 t gacha, kuzov 10-20 t). Ob'ektingiz poydevorigacha ehtiyotkorlik bilan tushirib beramiz.",
        "adv-c5-title": "Haqiqiy hajm va siniqlarsiz",
        "adv-c5-desc": "Streych-plyonka va mustahkam lenta bilan yog'och tagliklarga (poddon) qadoqlash. Agar tushirish paytida bitta blok sinsa ham — o'z hisobimizdan almashtiramiz.",
        "adv-c6-title": "Qabul qilganda to'lov",
        "adv-c6-desc": "Jismoniy shaxslar uchun yashirin to'lovlar yoki oldindan to'lov yo'q. Sifat va sonini joyida tekshirasiz, so'ng naqd yoki karta orqali to'laysiz.",
        "calc-badge": "30 SONIYADA ANIQ HISOBLASH",
        "calc-title": "Shlakobloklar va narxni hisoblash kalkulyatori",
        "calc-subtitle": "Bloklarning aniq soni, tagliklar soni, yetkazib berish og'irligi va hajm bo'yicha chegirma bilan yakuniy summani hisoblang.",
        "calc-step1-lbl": "1. Blok turini tanlang:",
        "calc-t1-title": "Devoriy 4 bo'shliqli",
        "calc-t1-sub": "390×190×190 mm • 195 ₸/dona",
        "calc-t2-title": "Devoriy 2 bo'shliqli",
        "calc-t2-sub": "390×190×190 mm • 205 ₸/dona",
        "calc-t3-title": "To'la mustahkamlangan",
        "calc-t3-sub": "390×190×190 mm • 275 ₸/dona",
        "calc-t4-title": "To'siq uchun yarim blok",
        "calc-t4-sub": "390×90×190 mm • 145 ₸/dona",
        "calc-step2-lbl": "2. Hisoblash usuli:",
        "calc-tab-walls": "Devor o'lchamlari bo'yicha (bino)",
        "calc-tab-qty": "Dona soni bo'yicha",
        "calc-len-lbl": "Devorlarning umumiy uzunligi (m):",
        "calc-len-hint": "Masalan, 10×10 m uy = 40 m",
        "calc-h-lbl": "Devor balandligi (m):",
        "calc-h-hint": "Standart 2.8 - 3.0 m",
        "calc-thick-lbl": "Terish qalinligi:",
        "calc-thick-opt1": "Yarim blok (190 mm) — yordamchi binolar, garaj, devorlar uchun",
        "calc-thick-opt2": "1 blok (390 mm) — issiq uylar, omborlar uchun",
        "calc-open-lbl": "Deraza va eshiklar maydoni (m²):",
        "calc-open-hint": "Devor hajmidan ayirib tashlanadi",
        "calc-margin-lbl": "Kesish va sinish uchun 5% zaxira (ustalar tavsiya etadi)",
        "calc-qty-lbl": "Kerakli bloklar soni (dona):",
        "calc-qty-hint": "Sizga kerakli bloklar miqdorini ko'rsating",
        "calc-step3-lbl": "3. Yetkazib berish:",
        "calc-del-opt1-title": "Sex manipulyatori (tushirish bilan)",
        "calc-del-opt1-sub": "Shahar va viloyat bo'yicha, logist tomonidan aniq hisob",
        "calc-del-opt2-title": "Sex omboridan olib ketish (o'zi olib ketish)",
        "calc-del-opt2-sub": "Poddonlarda yuklagich bilan bepul yuklab berish",
        "calc-res-title": "Smeta va buyurtma parametrlari",
        "calc-res-lbl-blocks": "Bloklar soni:",
        "calc-res-lbl-pallets": "Tagliklar (poddon) soni:",
        "calc-res-lbl-volume": "Umumiy terish hajmi:",
        "calc-res-lbl-weight": "Taxminiy yuk og'irligi:",
        "calc-res-lbl-trucks": "Kerakli transport:",
        "calc-res-lbl-total": "Yakuniy qiymati:",
        "calc-res-btn": "<span>Chegirmali narxni mahkamlash</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "calc-res-note": "🔒 Narxni mahkamlash 14 kun amal qiladi. Oldindan to'lov yo'q!",
        "cat-tag": "MAHSULOTLAR TURI",
        "cat-title": "Ishlab chiqaruvchidan shlakobloklar katalogi",
        "cat-subtitle": "Barcha mahsulotlar GOST 6133-99 talablariga qat'iy muvofiq yarim quruq hajmiy vibropresslash usulida ishlab chiqarilgan.",
        "cat-filter-all": "Barcha blok turlari",
        "cat-filter-wall": "Devoriy (390×190×190)",
        "cat-filter-part": "To'siq (390×90×190)",
        "cat-filter-heavy": "Poydevor va kuchaytirilgan",
        "btn-order": "Buyurtma berish",
        "card1-badge": "ENG KO'P SOTILGAN",
        "card1-title": "Devoriy 4 bo'shliqli shlakoblok",
        "card2-badge": "OPTIMAL",
        "card2-title": "Devoriy 2 bo'shliqli shlakoblok",
        "card3-badge": "YUQORI MUSTAHKAMLIK",
        "card3-title": "To'la poydevor shlakobloki",
        "card4-badge": "TO'SIQLAR UCHUN",
        "card4-title": "To'siq shlakobloki (yarim blok)",
        "card5-badge": "ISSIQ",
        "card5-title": "Keramzit-betonli issiq blok",
        "card6-badge": "ESTETIKA",
        "card6-title": "Dekorativ «Yirtiq tosh» bloki",
        "spec-lbl-size": "O'lchami:",
        "spec-lbl-strength": "Mustahkamlik markasi:",
        "spec-lbl-hollow": "Bo'shliqligi:",
        "spec-lbl-weight": "Blok og'irligi:",
        "spec-lbl-pallet": "Poddonda:",
        "spec-lbl-frost": "Sovuqqa chidamliligi:",
        "spec-lbl-sound": "Shovqin izolyatsiyasi:",
        "spec-lbl-thermal": "Issiqlik o'tkazuvchanligi:",
        "spec-lbl-eco": "Ekologik tozaligi:",
        "spec-lbl-texture": "Fakturasi:",
        "spec-lbl-purpose": "Mo'ljallanishi:",
        "spec-lbl-colors": "Ranglar:",
        "spec-v-hollow30": "30% (issiqlik tejovchi)",
        "spec-v-hollow40": "40% (qalin devorlar)",
        "spec-v-hollow0": "0% (monolit)",
        "spec-v-hollow2": "2 tirqishli bo'shliq",
        "spec-v-pallet72": "72 dona (1 332 kg)",
        "spec-v-pallet72-2": "72 dona (1 440 kg)",
        "spec-v-pallet60": "60 dona (1 560 kg)",
        "spec-v-pallet144": "144 dona (1 440 kg)",
        "spec-v-pallet72-c": "72 dona (972 kg)",
        "spec-v-frost50": "F50 (50 tsikldan)",
        "spec-v-sound-hi": "Yuqori (48 dB gacha)",
        "spec-v-eco-clay": "100% tabiiy loy",
        "spec-v-texture-stone": "Qirqilgan old yuzasi",
        "spec-v-purp-found": "Tsokollar, poydevorlar, ustunlar",
        "spec-v-purp-fence": "Devorlar, tsokol, fasadlar",
        "spec-v-colors": "Kulrang, grafit, shokolad",
        "unit-pallet-14040": "/ dona (14040 ₸/poddon)",
        "unit-pallet-14760": "/ dona (14760 ₸/poddon)",
        "unit-pallet-16500": "/ dona (16500 ₸/poddon)",
        "unit-pallet-20880": "/ dona (20880 ₸/poddon)",
        "unit-pallet-23400": "/ dona (23400 ₸/poddon)",
        "table-tag": "TEXNIK MA'LUMOTLAR",
        "table-title": "GOST 6133-99 bo'yicha bloklar xususiyatlarini taqqoslash",
        "table-subtitle": "Zavodimizning har bir partiyasi laboratoriya sinovlarining rasmiy ko'rsatkichlari.",
        "th-type": "Blok turi",
        "th-dims": "O'lchamlari (mm)",
        "th-hollow": "Bo'shliqligi",
        "th-strength": "Mustahkamlik markasi",
        "th-frost": "Sovuqqa chidamliligi",
        "th-weight": "Og'irligi (kg)",
        "th-pallet": "Poddonda (dona)",
        "tb-row1-type": "Devoriy 4 bo'shliqli",
        "tb-row2-type": "Devoriy 2 bo'shliqli",
        "tb-row3-type": "To'la poydevorli",
        "tb-row3-hollow": "0% (yaxlit)",
        "tb-row4-type": "To'siq (yarim blok)",
        "tb-row5-type": "Keramzit-beton devoriy",
        "prod-tag": "SEX TEXNOLOGIYASI",
        "prod-title": "Biz qanday qilib ishonchli bloklar ishlab chiqaramiz",
        "prod-subtitle": "To'g'ri vibropresslash texnologiyasiga uyingiz 70 yil yoriqlarsiz turishi bog'liq.",
        "prod-banner-badge": "TO'LIQ TSIKLLI SEX",
        "prod-banner-title": "«BLOCKMASTER» avtomatlashtirilgan vibropress liniyasi",
        "prod-banner-desc": "Sement, suv va fraktsion to'ldiruvchini kompyuter orqali dozalash inson omilini bartaraf qiladi.",
        "prod-step1-title": "Xomashyoni tayyorlash",
        "prod-step1-desc": "Yuvilgan granit tosh 0-5 mm va portlandsement M500. Loy va chiqindilarsiz qattiq aralashma.",
        "prod-step2-title": "Vibropresslash",
        "prod-step2-desc": "Maksimal zichlik uchun yuqori chastotali tebranish bilan 160 atmosfera bosimi ostida matritsada presslash.",
        "prod-step3-title": "Bug'lash kamerasi",
        "prod-step3-desc": "70°C haroratda bug' bilan termonamlik bilan ishlov berish. Blok 28 kun o'rniga 24 soatda loyiha mustahkamligiga erishadi.",
        "prod-step4-title": "OTK nazorati va ombor",
        "prod-step4-desc": "Diagonallarni o'lchash, pressda sinov, ehtiyotkor yetkazib berish uchun evropoddonlarga streych-plyonkada qadoqlash.",
        "del-tag": "O'Z AVTOPARKI",
        "del-title": "Buyurtma kunida manipulyator bilan tez yetkazib berish",
        "del-subtitle": "Poddonlarni to'g'ridan-to'g'ri qurilish maydonchangizga tushiramiz yoki ikkinchi qavat orayopmasiga ko'tarib beramiz.",
        "del-perk1-title": "5t, 10t va 20t li manipulyatorlar",
        "del-perk1-desc": "Tor ko'chalar yoki yirik qurilish ob'ektlari uchun mos mashinani tanlaymiz.",
        "del-perk2-title": "Strela bilan ehtiyotkor tushirish",
        "del-perk2-desc": "Samosval kabi ag'darish yo'q — bloklar sinmaydi va tirnalmaydi.",
        "del-perk3-title": "Haftasiga 6 kun olib ketish imkoni",
        "del-perk3-desc": "Avtoyuklagich bilan 15 daqiqada bepul va tez yuklab berish.",
        "del-cta-text": "Aholi punktigacha yetkazib berishning aniq narxini bilib oling:",
        "del-cta-btn": "Yetkazib berishni hisoblash",
        "truck1-badge": "KICHIK MANIPULYATOR",
        "truck1-title": "KAMAZ / ISUZU (5 tonnagacha)",
        "truck1-cap": "Sig'imi: <strong>250 blokgacha (3–4 poddon)</strong>",
        "truck1-desc": "Qo'shimcha binolar, garajlar, devorlar va tor yo'llar uchun ideal.",
        "truck2-badge": "ENG TALABGIR",
        "truck2-title": "MAZ / KAMAZ (10–12 tonnagacha)",
        "truck2-cap": "Sig'imi: <strong>650 blokgacha (8–9 poddon)</strong>",
        "truck2-desc": "Uyning 1-qavati yoki xo'jalik bloki qurilishi uchun maqbul.",
        "truck3-badge": "OG'IR MANIPULYATOR",
        "truck3-title": "UZUN O'LCHAMLI (20–25 tonnagacha)",
        "truck3-cap": "Sig'imi: <strong>1 300 blokgacha (18 poddon)</strong>",
        "truck3-desc": "Katta qurilishlar va minimal tarif bo'yicha ulgurji yetkazib berish uchun.",
        "rev-tag": "HAQIQIY TAJRIBA",
        "rev-title": "Quruvchilar va buyurtmachilar nima deydi",
        "rev-subtitle": "Sexning 7 yillik faoliyati davomida 1 200 dan ortiq qurilgan ob'ektlar.",
        "rev1-author": "Aleksey Novikov",
        "rev1-role": "Qurilish brigadasi prorabi",
        "rev1-text": "«Ushbu sexdan ketma-ket uchinchi mavsum olyapmiz. Asosiy afzalligi — geometriya. Choklar 8 mm gacha tekis chiqadi, qorishma minimal sarflanadi. Bloklar baquvvat, ko'chirganda sinmaydi. Manipulyator haydovchisi poddonlarni poydevor perimetriga juda ustalik bilan qo'yib berdi.»",
        "rev1-object": "Ob'ekt: Kottedj 160 m² (2 800 blok)",
        "rev2-author": "Bahrom Karimov",
        "rev2-role": "Xususiy quruvchi",
        "rev2-text": "«Mansardali garaj qurayotgan edim. Ertalab soat 9 da qo'ng'iroq qildim, menejer kalkulyatordan o'lchamlar bo'yicha hisoblashga yordam berdi. Soat 14:00 da mashina hovlimda tushirayotgan edi. Haydovchiga ko'rib chiqqach to'ladim. Bloklar yangi, taqillatganda jaranglaydi, mustahkamligi a'lo!»",
        "rev2-object": "Ob'ekt: Garaj 7x9 m (950 blok)",
        "rev3-author": "Sergey Vasilev",
        "rev3-role": "Ombor majmuasi bosh pudratchisi",
        "rev3-text": "«To'la va 4 bo'shliqli bloklarning katta partiyasiga (14 000 dona) buyurtma bergan edik. Sex grafigini kundan-kunga aniq bajardi. Sifat pasportlari va sinov bayonnomalarini taqdim etishdi. Poddonlarda birorta ham siniq yo'q. Ishonchli to'g'ridan-to'g'ri ishlab chiqaruvchi sifatida tavsiya qilaman.»",
        "rev3-object": "Ob'ekt: Angar-ombor 450 m² (14 000 blok)",
        "faq-tag": "SAVOLLAR VA JAVOBLAR",
        "faq-title": "Ko'p beriladigan savollar",
        "faq-subtitle": "Shlakobloklar partiyasiga buyurtma berishdan oldin bilish kerak bo'lgan hamma narsa.",
        "faq-q1": "1 m² va 1 m³ terishda nechta shlakoblok ketadi?",
        "faq-a1": "Standart 390×190×190 mm o'lcham va 10 mm chok qalinligida:<br>• Yarim blok qalinligidagi (19 sm) devorning 1 m² maydoniga <strong>12.5 ta blok</strong> ketadi.<br>• Butun blok qalinligidagi (39 sm) devorning 1 m² maydoniga <strong>25 ta blok</strong> ketadi.<br>• 1 m³ yaxlit devor terishga roppa-rosa <strong>62.5 ta blok</strong> ketadi.",
        "faq-q2": "Bitta yog'och taglikka (poddon) nechta blok sig'adi?",
        "faq-a2": "Standart evropoddonga <strong>72 dona</strong> devoriy blok joylashadi (poddon og'irligi taxminan 1.33 tonna) yoki <strong>144 dona</strong> to'siq yarim bloklari. To'la poydevor bloklari esa og'irligi sababli <strong>60 donadan</strong> taxlanadi.",
        "faq-q3": "Zavodda bug'langan blokni qo'lbola blokdan qanday ajratish mumkin?",
        "faq-a3": "Qo'lbola bloklar ochiq quyoshda quritiladi: rangi ochiq, chetlari barmoq bilan ushlaganda uqalanadi, geometriyasi qiyshiq (1–2 sm gacha farq), taqillatganda bo'g'iq tovush chiqaradi. Kameradan chiqqan zavod bloki bir tekis kulrang tusga, aniq to'g'ri burchaklarga ega bo'ladi, bolg'a bilan urganda jarangdor tovush beradi va parchalanib ketmaydi.",
        "faq-q4": "Oldindan to'lov kerakmi va to'lov qanday amalga oshiriladi?",
        "faq-a4": "Jismoniy shaxslar uchun standart hajmdagi buyurtmalarda <strong>oldindan to'lov talab qilinmaydi</strong>! Siz yetkazib berishga buyurtma berasiz, haydovchi poddonlarni keltiradi, sifatni tekshirasiz va joyida naqd yoki o'tkazma orqali hisob-kitob qilasiz. Yuridik shaxslar uchun QQS bilan/QQSsiz naqdsiz to'lov mavjud.",
        "faq-q5": "Ulgurji narxlar uchun chegirmalar bormi?",
        "faq-a5": "Ha! 1 000 donadan ortiq buyurtmada 3% chegirma, 3 000 donadan — 5%, 5 000 donadan esa — maxsus narx va manipulyatorga imtiyozli tarif beriladi.",
        "cnt-form-badge": "SHAXSIY HISOBLASH",
        "cnt-form-title": "Bloklar yetkazib berishga ariza qoldiring",
        "cnt-form-desc": "Sex menejeri 10 daqiqa ichida siz bilan bog'lanadi, mavjudligini aniqlaydi va ob'ektingizgacha yetkazib berishni hisoblab beradi.",
        "cnt-lbl-name": "Ismingiz:",
        "cnt-ph-name": "Azizbek Karimov",
        "cnt-lbl-phone": "Telefon raqamingiz:",
        "cnt-lbl-prod": "Sizni nima qiziqtirmoqda:",
        "cnt-opt-wall4": "Devoriy 4 bo'shliqli (390×190×190)",
        "cnt-opt-wall2": "Devoriy 2 bo'shliqli (390×190×190)",
        "cnt-opt-solid": "To'la poydevorli (390×190×190)",
        "cnt-opt-part": "To'siq yarim bloklari (390×90×190)",
        "cnt-opt-clay": "Keramzit-beton bloklar",
        "cnt-opt-all": "Loyiha bo'yicha to'liq hisob kerak",
        "cnt-lbl-addr": "Yetkazib berish manzili yoki tumani (yoki olib ketish):",
        "cnt-ph-addr": "Masalan: Mirzo Ulug'bek tumani, Bog'bonlar ko'chasi 12",
        "cnt-btn-submit": "<span>Hisob-kitobni olish va cheginputni saqlash</span>",
        "cnt-privacy": "Tugmani bosish orqali siz shaxsiy ma'lumotlarni qayta ishlashga rozilik bildirasiz. Biz spam tarqatmaymiz.",
        "cnt-info-tag": "TAYYOR MAHSULOTLAR SEXI VA OMBORI",
        "cnt-info-title": "Ishlab chiqarishimizga tashrif buyuring",
        "cnt-info-desc": "Xarid qilishdan oldin blok namunalarini shaxsan ko'rishingiz, shtangensirkul bilan geometriyasini va mustahkamligini tekshirishingiz mumkin.",
        "cnt-lbl-work-addr": "Ishlab chiqarish va ombor manzili:",
        "cnt-val-work-addr": "Sanoat zonasi, Zavod yo'li, 4-ombor",
        "cnt-lbl-hours": "Yuklash va ish grafigi:",
        "cnt-val-hours": "Dush – Shan: 08:00 dan 20:00 gacha<br>Yak: oldindan kelishuv bo'yicha",
        "cnt-lbl-sales-phone": "Sotuv bo'limining to'g'ridan-to'g'ri telefoni:",
        "cnt-phone-multi": "(ko'p kanalli)",
        "cnt-lbl-messengers": "Tezkor aloqa uchun messenjerlar:",
        "cnt-map-title": "«MONOLIT-BLOK» shlakoblok sexi",
        "cnt-map-desc": "Uzun o'lchamli mashina va Gazellar uchun qulay yo'l, betonli yuklash maydonchasi",
        "ft-about": "GOST 6133-99 bo'yicha devoriy va to'siq vibropresslangan shlakobloklarning to'g'ridan-to'g'ri ishlab chiqaruvchisi. Xususiy va tijorat qurilishi uchun ishonchli yetkazib berish.",
        "ft-copy": "© 2026 «MONOLIT-BLOK» zavodi. Barcha huquqlar himoyalangan.",
        "ft-h-prod": "Mahsulotlar",
        "ft-p1": "Devoriy 4 bo'shliqli",
        "ft-p2": "Devoriy 2 bo'shliqli",
        "ft-p3": "To'la poydevorli",
        "ft-p4": "To'siq yarim bloklari",
        "ft-p5": "Keramzit-beton bloklar",
        "ft-p6": "Dekorativ tosh bloklar",
        "ft-h-nav": "Navigatsiya",
        "ft-n1": "Hisoblash kalkulyatori",
        "ft-n2": "Sex afzalliklari",
        "ft-n3": "Texnologiya va GOST",
        "ft-n4": "Yetkazib berish shartlari",
        "ft-n5": "Mijozlar sharhlari",
        "ft-n6": "Ombor va kontaktlar",
        "ft-h-sales": "Sotuv bo'limi",
        "ft-lbl-phone": "Telefon:",
        "ft-lbl-email": "Elektron pochta:",
        "ft-lbl-addr": "Manzil:",
        "ft-val-addr": "Sanoat zonasi, Zavod yo'li, 4",
        "ft-btn-call": "Qo'ng'iroq buyurtma qilish",
        "modal-badge": "TEZKOR BUYURTMA",
        "modal-title": "Arizani rasmiylashtirish",
        "modal-subtitle": "Aloqa ma'lumotlaringizni to'ldiring, va biz 10 daqiqa ichida tasdiqlash uchun bog'lanamiz.",
        "modal-lbl-name": "Ismingiz:",
        "modal-ph-name": "Azizbek",
        "modal-lbl-phone": "Aloqa telefoni:",
        "modal-lbl-comment": "Izoh / Yetkazib berish manzili (ixtiyoriy):",
        "modal-ph-comment": "Yetkazib berish tumani yoki kerakli sanani ko'rsating",
        "modal-btn": "<span>Arizani tasdiqlash</span>",
        "modal-privacy": "To'lov faqat ob'ektda tovar qabul qilib tekshirilgandan so'ng."
}
};

function switchLang(lang) {
    currentLang = lang;

    // 1. Переключение кнопок в шапке
    const btnRU = document.getElementById('langRU');
    const btnUZ = document.getElementById('langUZ');
    if (btnRU) btnRU.classList.toggle('active', lang === 'ru');
    if (btnUZ) btnUZ.classList.toggle('active', lang === 'uz');

    // 2. Обновление атрибута lang на html
    const htmlRoot = document.getElementById('htmlRoot') || document.documentElement;
    htmlRoot.lang = lang;

    // 3. Заголовок страницы
    if (lang === 'uz') {
        document.title = 'MONOLIT-BLOK | GOST shlakobloklari ishlab chiqarish zavodi va sexi';
    } else {
        document.title = 'МОНОЛИТ-БЛОК | Завод и цех по производству шлакоблоков ГОСТ';
    }

    // 4. Переводим все элементы с data-i18n
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ru;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            el.innerHTML = dict[key];
        }
    });

    // 5. Переводим плейсхолдеры data-i18n-ph
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key] !== undefined) {
            el.placeholder = dict[key];
        }
    });

    // 6. Поддержка элементов с data-ru / data-uz (например, галерея)
    document.querySelectorAll('[data-ru][data-uz]').forEach(el => {
        const val = lang === 'ru' ? el.getAttribute('data-ru') : el.getAttribute('data-uz');
        if (val !== null) {
            el.textContent = val;
        }
    });

    // 7. Пересчет калькулятора с новыми языковыми строками
    if (typeof calculateBlocks === 'function') {
        calculateBlocks();
    }

    // 8. Сохраняем выбор в localStorage
    try {
        localStorage.setItem('siteLang', lang);
        localStorage.setItem('sitelang', lang);
    } catch (e) {}
}

// Восстановление языка при инициализации
function initSavedLanguage() {
    let saved = 'ru';
    try {
        saved = localStorage.getItem('siteLang') || localStorage.getItem('sitelang') || 'ru';
    } catch (e) {}

    if (saved === 'uz') {
        switchLang('uz');
    } else {
        switchLang('ru');
    }
}

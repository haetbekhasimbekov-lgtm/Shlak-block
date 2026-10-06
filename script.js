/**
 * МОНОЛИТ-БЛОК — СКРИПТЫ ВЗАИМОДЕЙСТВИЯ И КАЛЬКУЛЯТОР
 */

document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    initMobileNav();
});

/* ==========================================================
   ДАННЫЕ И ЛОГИКА КАЛЬКУЛЯТОРА
   ========================================================== */

const BLOCK_DATA = {
    wall4: { name: 'Стеновой 4-х пустотный (390×190×190)', price: 195, weight: 18.5, pallet: 72, volume: 0.014 },
    wall2: { name: 'Стеновой 2-х пустотный (390×190×190)', price: 205, weight: 20.0, pallet: 72, volume: 0.014 },
    solid: { name: 'Полнотелый фундаментный (390×190×190)', price: 275, weight: 26.0, pallet: 60, volume: 0.014 },
    partition: { name: 'Перегородочный полублок (390×90×190)', price: 145, weight: 10.0, pallet: 144, volume: 0.0067 }
};

let currentCalcMode = 'walls';
let selectedBlockType = 'wall4';
let lastCalcResult = null;

function initCalculator() {
    // Выбор типа блока
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBlockType = btn.getAttribute('data-type');
            calculateBlocks();
        });
    });

    // Слушатели ввода полей
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

    // Радиокнопки доставки
    const deliveryRadios = document.querySelectorAll('input[name="calcDelivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', calculateBlocks);
    });

    // Первоначальный расчет
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
    const block = BLOCK_DATA[selectedBlockType];
    let totalPieces = 0;

    if (currentCalcMode === 'walls') {
        const length = parseFloat(document.getElementById('inputLength').value) || 0;
        const height = parseFloat(document.getElementById('inputHeight').value) || 0;
        const thickness = document.getElementById('inputThickness').value;
        const openings = parseFloat(document.getElementById('inputOpenings').value) || 0;
        const withMargin = document.getElementById('inputMargin').checked;

        // Чистая площадь стен
        const wallArea = Math.max(0, (length * height) - openings);

        // Расчет штук на м2:
        // Если стена в 190 мм (в полблока) = 12.5 шт/м²
        // Если стена в 390 мм (в блок) = 25 шт/м²
        let pcsPerM2 = 12.5;
        if (selectedBlockType === 'partition') {
            pcsPerM2 = 12.5; // полублок
        } else if (thickness === '390') {
            pcsPerM2 = 25.0;
        }

        let pieces = Math.ceil(wallArea * pcsPerM2);

        if (withMargin) {
            pieces = Math.ceil(pieces * 1.05); // +5% запас
        }

        totalPieces = pieces;
    } else {
        totalPieces = parseInt(document.getElementById('inputDirectQty').value) || 0;
    }

    if (totalPieces < 0) totalPieces = 0;

    // Расчет поддонов
    const pallets = Math.ceil(totalPieces / block.pallet);

    // Вес в тоннах
    const totalWeightKg = totalPieces * block.weight;
    const totalWeightTons = (totalWeightKg / 1000).toFixed(1);

    // Объем в м³
    const totalVolumeM3 = (totalPieces * block.volume).toFixed(1);

    // Потребность машин
    let trucks = '1 рейс (5т)';
    if (totalWeightKg > 15000) {
        trucks = `${Math.ceil(totalWeightKg / 15000)} рейса (15т)`;
    } else if (totalWeightKg > 5000) {
        trucks = '1 рейс (10-12т)';
    }

    // Скидки
    let discountPercent = 0;
    if (totalPieces >= 3000) {
        discountPercent = 5;
    } else if (totalPieces >= 1000) {
        discountPercent = 3;
    }

    const basePrice = totalPieces * block.price;
    const discountAmount = Math.round(basePrice * (discountPercent / 100));
    const finalPrice = basePrice - discountAmount;

    // Обновление UI
    document.getElementById('resTotalBlocks').textContent = `${formatNumber(totalPieces)} шт.`;
    document.getElementById('resPallets').textContent = `${pallets} паллет (${block.pallet} шт/поддон)`;
    document.getElementById('resVolume').textContent = `${totalVolumeM3} м³`;
    document.getElementById('resWeight').textContent = `${totalWeightTons} т`;
    document.getElementById('resTrucks').textContent = trucks;
    document.getElementById('resTotalPrice').textContent = `${formatNumber(finalPrice)} ₸`;

    const discountBadge = document.getElementById('discountBadge');
    const savingsEl = document.getElementById('resSavings');

    if (discountPercent > 0) {
        discountBadge.style.display = 'inline-block';
        discountBadge.textContent = `Скидка за объем: ${discountPercent}%`;
        savingsEl.style.display = 'block';
        savingsEl.textContent = `Ваша выгода: ${formatNumber(discountAmount)} ₸`;
    } else {
        discountBadge.style.display = 'none';
        savingsEl.style.display = 'none';
    }

    // Сохраняем объект результата для модалки
    lastCalcResult = {
        blockName: block.name,
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

    // Закрываем другие
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

function openModal(title = 'Быстрая заявка', subtitle = 'Оставьте номер телефона, и технолог цеха свяжется с вами в течение 10 минут.') {
    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSubtitle').textContent = subtitle;
    document.getElementById('modalSummaryBox').style.display = 'none';
    document.getElementById('modalProductName').value = title;
    modal.classList.add('active');
}

function openOrderModal(productName, price) {
    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = 'Заказ шлакоблоков';
    document.getElementById('modalSubtitle').textContent = 'Укажите желаемое количество или адрес для расчета доставки:';
    
    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = productName;
    document.getElementById('modalSummaryDetails').textContent = `Базовая стоимость: ${price} ₸ / шт. В наличии на складе.`;
    
    document.getElementById('modalProductName').value = productName;
    document.getElementById('modalOrderSummary').value = `Товар: ${productName}, Цена: ${price} тнг.`;
    modal.classList.add('active');
}

function orderFromCalculator() {
    if (!lastCalcResult) {
        calculateBlocks();
    }
    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = 'Фиксация цены из калькулятора';
    document.getElementById('modalSubtitle').textContent = 'Ваш расчет готов! Закрепите скидку и бронь блоков за вашим номером:';

    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = lastCalcResult.blockName;
    document.getElementById('modalSummaryDetails').textContent = 
        `Объем: ${formatNumber(lastCalcResult.pieces)} шт. (${lastCalcResult.pallets} паллет, ~${lastCalcResult.weight} т). Итого со скидкой: ${formatNumber(lastCalcResult.price)} ₸`;

    document.getElementById('modalProductName').value = 'Заказ из калькулятора';
    document.getElementById('modalOrderSummary').value = 
        `Блок: ${lastCalcResult.blockName}, Штук: ${lastCalcResult.pieces}, Паллет: ${lastCalcResult.pallets}, Вес: ${lastCalcResult.weight}т, Сумма: ${lastCalcResult.price} тнг.`;

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
}

// Закрытие по ESC
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
    const name = document.getElementById('modalName').value;
    const phone = document.getElementById('modalPhone').value;
    const product = document.getElementById('modalProductName').value;

    closeModal();
    showToast(
        'Заявка успешно принята!',
        `Спасибо, ${name}! Менеджер цеха свяжется с вами по номеру ${phone} для подтверждения.`
    );
    e.target.reset();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('leadName').value;
    const phone = document.getElementById('leadPhone').value;
    const product = document.getElementById('leadProduct').value;

    showToast(
        'Заявка зарегистрирована!',
        `Спасибо, ${name}! Расчет по продукции «${product}» отправлен в отдел сбыта.`
    );
    e.target.reset();
}

function showToast(title, message) {
    const toast = document.getElementById('toast');
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
                document.body.style.overflow = 'hidden'; // Prevent scroll when menu is open
            } else {
                document.body.style.overflow = '';
            }
        });

        // Закрытие при клике на ссылку
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
    // Dynamically add reveal classes to elements
    const leftElements = document.querySelectorAll('.hero__content, .delivery-info, .contacts-info-card');
    leftElements.forEach(el => { el.classList.add('reveal', 'reveal-left'); });

    const rightElements = document.querySelectorAll('.hero__card-preview, .delivery-fleet, .contact-form-card');
    rightElements.forEach(el => { el.classList.add('reveal', 'reveal-right'); });

    const bottomElements = document.querySelectorAll('.section-header, .feature-card, .product-card, .step-card, .review-card, .accordion-item');
    bottomElements.forEach((el, index) => { 
        el.classList.add('reveal', 'reveal-bottom');
        // Add slight delay for grid items
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
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// Ensure it runs after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

/* ==========================================================
   ГАЛЕРЕЯ ФИЛЬТРАЦИЯ
   ========================================================== */

function filterGallery(category, btn) {
    // Обновляем активную кнопку
    document.querySelectorAll('.gallery-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Фильтруем элементы
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

/* ==========================================================
   LIGHTBOX
   ========================================================== */

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
let currentLang = 'ru';

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

// Навигация по клавишам
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') lightboxNav(1);
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'Escape') closeLightbox();
});

/* ==========================================================
   ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (UZ / RU)
   ========================================================== */

const TRANSLATIONS = {
    ru: {
        // Топ-бар
        'top-address': 'Промзона, Заводской проезд, склад №4 (Пн–Сб: 08:00–20:00)',
        'top-stock': 'В наличии на складе: <strong>65 000+ блоков</strong> готовых к отгрузке',
        'top-callback': 'Заказать звонок',
        // Навигация
        'nav-catalog': 'Продукция',
        'nav-calc': 'Калькулятор',
        'nav-advantages': 'Преимущества',
        'nav-production': 'Производство',
        'nav-delivery': 'Доставка',
        'nav-reviews': 'Отзывы',
        'nav-contacts': 'Контакты',
        // Герой
        'hero-badge': 'Прямой производитель • Без посредников',
        'hero-title': 'Производство шлакоблоков ГОСТ <br><span class="text-gradient">с доставкой манипулятором</span> в день заказа',
        'hero-btn1': 'Рассчитать стоимость онлайн',
        'hero-btn2': 'Смотреть каталог и цены',
        'hero-stat1-val': 'от 190 ₸',
        'hero-stat1-lbl': 'Оптовая цена за штуку',
        'hero-stat2-lbl': 'Сертифицированная прочность',
        'hero-stat3-val': 'до 12 000 шт.',
        'hero-stat3-lbl': 'Суточная мощность цеха',
        'hero-stat4-val': '0 ₸',
        'hero-stat4-lbl': 'Оплата только при получении',
    },
    uz: {
        'top-address': 'Sanoat zonasi, Zavod yo\'li, ombor №4 (Dush–Shan: 08:00–20:00)',
        'top-stock': 'Omborda mavjud: <strong>65 000+ blok</strong> jo\'natishga tayyor',
        'top-callback': 'Qo\'ng\'iroq buyurtma qilish',
        'nav-catalog': 'Mahsulotlar',
        'nav-calc': 'Kalkulyator',
        'nav-advantages': 'Afzalliklar',
        'nav-production': 'Ishlab chiqarish',
        'nav-delivery': 'Yetkazib berish',
        'nav-reviews': 'Sharhlar',
        'nav-contacts': 'Kontaktlar',
        'hero-badge': 'To\'g\'ridan-to\'g\'ri ishlab chiqaruvchi • Vositachilarsiz',
        'hero-title': 'GOST shlakobloklari ishlab chiqarish <br><span class="text-gradient">manipulyator bilan yetkazib berish</span> buyurtma kunida',
        'hero-btn1': 'Narxni onlayn hisoblash',
        'hero-btn2': 'Katalog va narxlarni ko\'rish',
        'hero-stat1-val': '190 ₸ dan',
        'hero-stat1-lbl': 'Ulgurji narx (dona)',
        'hero-stat2-lbl': 'Sertifikatlangan mustahkamlik',
        'hero-stat3-val': '12 000 donagacha',
        'hero-stat3-lbl': 'Sex kunlik quvvati',
        'hero-stat4-val': '0 ₸',
        'hero-stat4-lbl': 'To\'lov faqat olganingizda',
    }
};

function switchLang(lang) {
    currentLang = lang;

    // Кнопки
    document.getElementById('langRU').classList.toggle('active', lang === 'ru');
    document.getElementById('langUZ').classList.toggle('active', lang === 'uz');
    document.getElementById('htmlRoot').lang = lang;

    // Переводим все элементы с data-ru / data-uz
    document.querySelectorAll('[data-ru][data-uz]').forEach(el => {
        const val = lang === 'ru' ? el.getAttribute('data-ru') : el.getAttribute('data-uz');
        if (val !== null) el.textContent = val;
    });

    // Сохраняем выбор
    localStorage.setItem('siteLang', lang);
}

// Восстанавливаем язык при загрузке
(function() {
    const saved = localStorage.getItem('sitelang') || 'ru';
    if (saved === 'uz') {
        switchLang('uz');
    }
})();

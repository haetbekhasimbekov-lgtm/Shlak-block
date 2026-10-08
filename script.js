/**
 * МОНОЛИТ-БЛОК — СКРИПТЫ ВЗАИМОДЕЙСТВИЯ, КАЛЬКУЛЯТОР И МУЛЬТИЯЗЫЧНОСТЬ (RU / KZ)
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
        nameKz: 'Қабырғалық 4 қуысты (390×190×190)',
        price: 195, weight: 18.5, pallet: 72, volume: 0.014
    },
    wall2: {
        nameRu: 'Стеновой 2-х пустотный (390×190×190)',
        nameKz: 'Қабырғалық 2 қуысты (390×190×190)',
        price: 205, weight: 20.0, pallet: 72, volume: 0.014
    },
    solid: {
        nameRu: 'Полнотелый фундаментный (390×190×190)',
        nameKz: 'Тұтас іргетастық (390×190×190)',
        price: 275, weight: 26.0, pallet: 60, volume: 0.014
    },
    partition: {
        nameRu: 'Перегородочный полублок (390×90×190)',
        nameKz: 'Перделік жартылай блок (390×90×190)',
        price: 145, weight: 10.0, pallet: 144, volume: 0.0067
    },
    clay: {
        nameRu: 'Керамзитобетонный блок (390×190×190)',
        nameKz: 'Керамзит-бетон блок (390×190×190)',
        price: 290, weight: 13.5, pallet: 72, volume: 0.014
    },
    decor: {
        nameRu: 'Декоративный рваный камень (390×190×190)',
        nameKz: 'Сәндік жыртылған тас (390×190×190)',
        price: 325, weight: 21.0, pallet: 72, volume: 0.014
    }
};

function getBlockName(key) {
    const b = BLOCK_DATA[key];
    if (!b) return key;
    return currentLang === 'kz' ? b.nameKz : b.nameRu;
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

    const isKz = currentLang === 'kz';

    let trucks = isKz ? '1 рейс (5т)' : '1 рейс (5т)';
    if (totalWeightKg > 15000) {
        const trips = Math.ceil(totalWeightKg / 15000);
        trucks = isKz ? `${trips} рейс (15т)` : `${trips} рейса (15т)`;
    } else if (totalWeightKg > 5000) {
        trucks = isKz ? '1 рейс (10-12т)' : '1 рейс (10-12т)';
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

    if (resTotalBlocks) resTotalBlocks.textContent = `${formatNumber(totalPieces)} ${isKz ? 'дана' : 'шт.'}`;
    if (resPallets) resPallets.textContent = `${pallets} ${isKz ? 'паллет' : 'паллет'} (${block.pallet} ${isKz ? 'дана/поддон' : 'шт/поддон'})`;
    if (resVolume) resVolume.textContent = `${totalVolumeM3} ${isKz ? 'м³' : 'м³'}`;
    if (resWeight) resWeight.textContent = `${totalWeightTons} ${isKz ? 'т' : 'т'}`;
    if (resTrucks) resTrucks.textContent = trucks;
    if (resTotalPrice) resTotalPrice.textContent = `${formatNumber(finalPrice)} ₸`;

    const discountBadge = document.getElementById('discountBadge');
    const savingsEl = document.getElementById('resSavings');

    if (discountPercent > 0) {
        if (discountBadge) {
            discountBadge.style.display = 'inline-block';
            discountBadge.textContent = isKz ? `Көлем үшін жеңілдік: ${discountPercent}%` : `Скидка за объем: ${discountPercent}%`;
        }
        if (savingsEl) {
            savingsEl.style.display = 'block';
            savingsEl.textContent = isKz ? `Сіздің пайдаңыз: ${formatNumber(discountAmount)} ₸` : `Ваша выгода: ${formatNumber(discountAmount)} ₸`;
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
    const isKz = currentLang === 'kz';
    let title = isKz ? 'Жылдам өтінім' : 'Быстрая заявка';
    let subtitle = isKz ? 'Телефон нөміріңізді қалдырыңыз, цех технологы 10 минут ішінде хабарласады.' : 'Оставьте номер телефона, и технолог цеха свяжется с вами в течение 10 минут.';

    if (type === 'consult') {
        title = isKz ? 'Жылдам кеңес алу' : 'Быстрая консультация';
        subtitle = isKz ? 'Телефон нөміріңізді қалдырыңыз, маманымыз 10 минутта кеңес береді.' : 'Оставьте номер телефона, и технолог цеха свяжется с вами в течение 10 минут.';
    } else if (type === 'delivery') {
        title = isKz ? 'Жеткізу құнын есептеу' : 'Расчет стоимости доставки';
        subtitle = isKz ? 'Жеткізу мекенжайын көрсетіңіз, логист нақты бағасы мен уақытын есептейді:' : 'Укажите адрес доставки, и логист рассчитает точную стоимость и время прибытия:';
    } else if (type === 'callback') {
        title = isKz ? 'Кері қоңырау тапсырысы' : 'Заказ обратного звонка';
        subtitle = isKz ? 'Байланыс деректеріңізді қалдырыңыз, біз жақын арада хабарласамыз:' : 'Оставьте контактные данные, и мы перезвоним вам в ближайшее время:';
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
    const isKz = currentLang === 'kz';
    const productName = BLOCK_DATA[productKeyOrName] ? getBlockName(productKeyOrName) : productKeyOrName;

    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = isKz ? 'Шлакоблоктарға тапсырыс' : 'Заказ шлакоблоков';
    document.getElementById('modalSubtitle').textContent = isKz 
        ? 'Жеткізуді есептеу үшін қажетті мөлшерді немесе мекенжайды көрсетіңіз:' 
        : 'Укажите желаемое количество или адрес для расчета доставки:';
    
    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = productName;
    document.getElementById('modalSummaryDetails').textContent = isKz
        ? `Базалық бағасы: ${price} ₸ / дана. Қоймада бар.`
        : `Базовая стоимость: ${price} ₸ / шт. В наличии на складе.`;
    
    document.getElementById('modalProductName').value = productName;
    document.getElementById('modalOrderSummary').value = isKz
        ? `Тауар: ${productName}, Бағасы: ${price} тңг.`
        : `Товар: ${productName}, Цена: ${price} тнг.`;
    modal.classList.add('active');
}

function orderFromCalculator() {
    if (!lastCalcResult) {
        calculateBlocks();
    }
    const isKz = currentLang === 'kz';
    const blockTitle = getBlockName(lastCalcResult.blockKey || selectedBlockType);

    const modal = document.getElementById('orderModal');
    document.getElementById('modalTitle').textContent = isKz 
        ? 'Калькулятордан бағаны бекіту' 
        : 'Фиксация цены из калькулятора';
    document.getElementById('modalSubtitle').textContent = isKz
        ? 'Есебіңіз дайын! Жеңілдік пен блоктар бронын нөміріңізге бекітіңіз:'
        : 'Ваш расчет готов! Закрепите скидку и бронь блоков за вашим номером:';

    const summaryBox = document.getElementById('modalSummaryBox');
    summaryBox.style.display = 'block';
    document.getElementById('modalSummaryTitle').textContent = blockTitle;
    document.getElementById('modalSummaryDetails').textContent = isKz
        ? `Көлемі: ${formatNumber(lastCalcResult.pieces)} дана (${lastCalcResult.pallets} паллет, ~${lastCalcResult.weight} т). Жеңілдікпен жиыны: ${formatNumber(lastCalcResult.price)} ₸`
        : `Объем: ${formatNumber(lastCalcResult.pieces)} шт. (${lastCalcResult.pallets} паллет, ~${lastCalcResult.weight} т). Итого со скидкой: ${formatNumber(lastCalcResult.price)} ₸`;

    document.getElementById('modalProductName').value = isKz ? 'Калькулятордан тапсырыс' : 'Заказ из калькулятора';
    document.getElementById('modalOrderSummary').value = 
        `Блок: ${blockTitle}, Дана: ${lastCalcResult.pieces}, Паллет: ${lastCalcResult.pallets}, Сомасы: ${lastCalcResult.price} ₸`;

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
    const isKz = currentLang === 'kz';
    const name = document.getElementById('modalName').value;
    const phone = document.getElementById('modalPhone').value;

    closeModal();
    showToast(
        isKz ? 'Өтінім сәтті қабылданды!' : 'Заявка успешно принята!',
        isKz ? `Рақмет, ${name}! Цех менеджері растау үшін ${phone} нөміріне хабарласады.` : `Спасибо, ${name}! Менеджер цеха свяжется с вами по номеру ${phone} для подтверждения.`
    );
    e.target.reset();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const isKz = currentLang === 'kz';
    const name = document.getElementById('leadName').value;
    const phone = document.getElementById('leadPhone').value;
    const product = document.getElementById('leadProduct').value;

    showToast(
        isKz ? 'Өтінім тіркелді!' : 'Заявка зарегистрирована!',
        isKz ? `Рақмет, ${name}! «${product}» бойынша есеп сату бөліміне жіберілді.` : `Спасибо, ${name}! Расчет по продукции «${product}» отправлен в отдел сбыта.`
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
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.toggle('open');
            burger.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                burger.classList.remove('open');
                document.body.style.overflow = '';
            });
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) {
                nav.classList.remove('open');
                burger.classList.remove('open');
                document.body.style.overflow = '';
            }
        });

        // Закрытие по клавише Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                burger.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
}

/* ==========================================================
   SCROLL REVEAL ANIMATIONS
   ========================================================== */
function initScrollAnimations() {
    // На экранах <= 992px все блоки гарантированно отображаются сразу
    if (window.innerWidth <= 992) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
        return;
    }

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
        rootMargin: '100px 0px 100px 0px',
        threshold: 0.02
    };

    if ('IntersectionObserver' in window) {
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
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }

    // Страховочный таймер: через 600мс все блоки 100% становятся активными и видимыми
    setTimeout(() => {
        document.querySelectorAll('.reveal:not(.active)').forEach(el => el.classList.add('active'));
    }, 600);
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
        captionKz: 'Коттедж 200 м² — 4 200 дана М75 қабырғалық блок'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_garage.jpg',
        captionRu: 'Гараж-мастерская 18×9 м — 1 800 блоков 4-х пустотных',
        captionKz: 'Гараж-шеберхана 18×9 м — 1 800 дана 4 қуысты блок'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_factory.jpg',
        captionRu: 'Наш цех — автоматизированная вибропрессовая линия, 12 000 блоков/сутки',
        captionKz: 'Біздің цех — автоматтандырылған вибропресс желісі, 12 000 блок/тәулік'
    },
    {
        type: 'image',
        src: 'assets/images/gallery_warehouse.jpg',
        captionRu: 'Логистический склад 1 200 м² — 14 000 полнотелых блоков М100',
        captionKz: 'Логистикалық қойма 1 200 м² — 14 000 дана тұтас М100 блок'
    },
    {
        type: 'cert',
        icon: '📋',
        titleRu: 'Паспорт качества ГОСТ 6133-99',
        titleKz: 'ГОСТ 6133-99 сапа паспорты',
        descRu: 'Лабораторный протокол испытания на прочность, морозостойкость и геометрию каждой партии.',
        descKz: 'Әрбір партияның беріктігіне, аязға шыдамдылығына және геометриясына зертханалық сынақ хаттамасы.',
        details: [
            { labelRu: 'Марка прочности', labelKz: 'Беріктік маркасы', valueRu: 'М75 — М100', valueKz: 'М75 — М100' },
            { labelRu: 'Морозостойкость', labelKz: 'Аязға шыдамдылық', valueRu: 'F50 (50 циклов)', valueKz: 'F50 (50 цикл)' },
            { labelRu: 'Геометрия (откл.)', labelKz: 'Геометрия (ауытқу)', valueRu: '±1 мм по ГОСТ', valueKz: 'ГОСТ бойынша ±1 мм' },
            { labelRu: 'Выдан', labelKz: 'Берілген', valueRu: 'ОТК завода №1', valueKz: '№1 завод ТБК' }
        ]
    },
    {
        type: 'cert',
        icon: '🏆',
        titleRu: 'Сертификат соответствия',
        titleKz: 'Сәйкестік сертификаты',
        descRu: 'Продукция прошла добровольную сертификацию в независимой аккредитованной лаборатории.',
        descKz: 'Өнім тәуелсіз аккредиттелген зертханада ерікті сертификаттаудан өтті.',
        details: [
            { labelRu: 'Стандарт', labelKz: 'Стандарт', valueRu: 'ГОСТ 6133-99', valueKz: 'ГОСТ 6133-99' },
            { labelRu: 'Область', labelKz: 'Сала', valueRu: 'Стеновые блоки', valueKz: 'Қабырғалық блоктар' },
            { labelRu: 'Статус', labelKz: 'Мәртебесі', valueRu: '✓ Действующий', valueKz: '✓ Жарамды' },
            { labelRu: 'Орган', labelKz: 'Орган', valueRu: 'Независимая лаб.', valueKz: 'Тәуелсіз зертхана' }
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
        imgEl.alt = lang === 'ru' ? data.captionRu : data.captionKz;
        imgEl.style.display = 'block';
        certEl.style.display = 'none';
        captionEl.textContent = lang === 'ru' ? data.captionRu : data.captionKz;
    } else {
        imgEl.style.display = 'none';
        certEl.style.display = 'block';
        captionEl.textContent = '';

        const detailsHtml = data.details.map(d => `
            <div class="cert-detail-row">
                <span>${lang === 'ru' ? d.labelRu : d.labelKz}</span>
                <strong>${lang === 'ru' ? d.valueRu : d.valueKz}</strong>
            </div>
        `).join('');

        certEl.innerHTML = `
            <div class="cert-icon-big">${data.icon}</div>
            <h3>${lang === 'ru' ? data.titleRu : data.titleKz}</h3>
            <p>${lang === 'ru' ? data.descRu : data.descKz}</p>
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
   ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (KZ / RU) — СЛОВАРЬ И ЛОГИКА
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
    kz: {
        "top-address": "📍 Өнеркәсіп аймағы, Заводской өткелі, №4 қойма (Дүй–Сен: 08:00–20:00)",
        "top-stock": "<span class=\"pulse-dot\"></span> <span>Қоймада бар: <strong>65 000+ блок</strong> тиеп-жөнелтуге дайын</span>",
        "top-callback": "Қоңырауға тапсырыс беру",
        "logo-title": "МОНОЛИТ-БЛОК",
        "logo-subtitle": "№1 ӨНДІРІСТІК ЦЕХ",
        "nav-catalog": "Өнімдер",
        "nav-calc": "Калькулятор",
        "nav-advantages": "Артықшылықтар",
        "nav-production": "Өндіріс",
        "nav-delivery": "Жеткізу",
        "nav-reviews": "Пікірлер",
        "nav-contacts": "Байланыс",
        "header-btn-calc": "Бағаны есептеу",
        "hero-badge": "<span class=\"badge__dot\"></span> Тікелей өндіруші • Делдалдарсыз",
        "hero-title": "ГОСТ бойынша шлакоблоктар өндірісі <br><span class=\"text-gradient\">тапсырыс берген күні манипулятормен жеткізу</span>",
        "hero-desc": "Мінсіз геометриясы бар (ауытқуы 1 мм-ге дейін) М75–М100 маркалы қабырғалық, перделік және нығайтылған блоктар. Толық циклды булау камерасы, 100% маркалық беріктік. Төлем объектіде жүк түсірілгеннен кейін.",
        "hero-btn-calc": "<span>Құнын онлайн есептеу</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "hero-btn-catalog": "Каталог пен бағаларды қарау",
        "hero-stat1-num": "190 ₸ бастап",
        "hero-stat1-lbl": "Донбай (көтерме) бағасы",
        "hero-stat2-lbl": "Сертификатталған беріктік",
        "hero-stat3-num": "12 000 данаға дейін",
        "hero-stat3-lbl": "Цехтың тәуліктік қуаттылығы",
        "hero-stat4-lbl": "Төлем тек алған кезде",
        "hero-preview-tag": "Қоймада 65 000 дана бар",
        "hero-preview-title": "Қабырғалық 4 қуысты М75",
        "hero-preview-dims": "390 × 190 × 190 мм • Салмағы: 18.5 кг",
        "hero-preview-curprice": "195 ₸ / дана",
        "hero-preview-order": "Тапсырыс беру",
        "adv-tag": "НЕГЕ БІЗДІҢ ЦЕХТЫ ТАҢДАЙДЫ",
        "adv-title": "Абыройымызбен жауап беретін сапа",
        "adv-subtitle": "Біз қолдан жасалған өндіріс емеспіз — булау камералары мен өз зертханасы бар автоматтандырылған желіде жұмыс істейміз.",
        "adv-c1-title": "Мінсіз геометрия (±1 мм)",
        "adv-c1-desc": "160 тонна күшпен вибропресте пішіндеу. Тегіс қырлары қалау ерітіндісін 40%-ға дейін үнемдейді және тас қалаушылардың жұмысын 2 есе жылдамдатады.",
        "adv-c2-title": "70°C булау камерасы",
        "adv-c2-desc": "Блоктар ыстық буда 24 сағат ішінде жобалық беріктіктің 75%-ын алады. Олар үгітілмейді, шірімейді және жеткізілгеннен кейін бірден қалауға дайын.",
        "adv-c3-title": "ПЦ-500 Д0 маркалы цемент",
        "adv-c3-desc": "Тек шлак қоспасыз таза цемент пен 0-5 мм фракциялы гранит қиыршықтасын пайдаланамыз. Әрбір партияға сапа паспорты мен сертификаттар беріледі.",
        "adv-c4-title": "Жеке манипуляторлар автопаркі",
        "adv-c4-desc": "Гидроманипуляторлары бар 5 жеке жүк көлігіміз бар (жебе жүк көтергіштігі 3 т-ға дейін, шанақ 10-20 т). Объектіңіздің іргетасына дейін ұқыпты түсіріп береміз.",
        "adv-c5-title": "Шынайы көлем және сынықсыз",
        "adv-c5-desc": "Стретч-үлбірмен және бекіту таспасымен ағаш поддондарға орау. Егер жүк түсіру кезінде бірде-бір блок сынса — өз есебімізден ауыстырамыз.",
        "adv-c6-title": "Төлем тек алған кезде",
        "adv-c6-desc": "Жеке тұлғалар үшін ешқандай жасырын төлемдер немесе алдын ала төлемдер жоқ. Орнында сапасы мен санын тексересіз, содан кейін қолма-қол немесе картамен төлейсіз.",
        "calc-badge": "30 СЕКУНДТА НАҚТЫ ЕСЕПТЕУ",
        "calc-title": "Шлакоблоктар мен бағасын есептеу калькуляторы",
        "calc-subtitle": "Блоктардың нақты санын, поддондар санын, жеткізу салмағын және көлемдік жеңілдікпен соңғы соманы есептеңіз.",
        "calc-step1-lbl": "1. Блок түрін таңдаңыз:",
        "calc-t1-title": "Қабырғалық 4 қуысты",
        "calc-t1-sub": "390×190×190 мм • 195 ₸/дана",
        "calc-t2-title": "Қабырғалық 2 қуысты",
        "calc-t2-sub": "390×190×190 мм • 205 ₸/дана",
        "calc-t3-title": "Тұтас нығайтылған",
        "calc-t3-sub": "390×190×190 мм • 275 ₸/дана",
        "calc-t4-title": "Перделік жартылай блок",
        "calc-t4-sub": "390×90×190 мм • 145 ₸/дана",
        "calc-step2-lbl": "2. Есептеу әдісі:",
        "calc-tab-walls": "Қабырға өлшемдері бойынша (ғимарат)",
        "calc-tab-qty": "Дана саны бойынша",
        "calc-len-lbl": "Қабырғалардың жалпы ұзындығы (м):",
        "calc-len-hint": "Мысалы, 10×10 м үй = 40 м",
        "calc-h-lbl": "Қабырғалардың биіктігі (м):",
        "calc-h-hint": "Стандартты 2.8 - 3.0 м",
        "calc-thick-lbl": "Қалау қалыңдығы:",
        "calc-thick-opt1": "Жартылай блок (190 мм) — шаруашылық құрылыстары, гараждар, қоршаулар үшін",
        "calc-thick-opt2": "1 блок (390 мм) — жылы үйлер, қоймалар үшін",
        "calc-open-lbl": "Терезелер мен есіктер ауданы (м²):",
        "calc-open-hint": "Қабырға көлемінен шегеріледі",
        "calc-margin-lbl": "Қию мен сыныққа 5% қор (шеберлер ұсынады)",
        "calc-qty-lbl": "Кажетті блоктар саны (дана):",
        "calc-qty-hint": "Сізге қажетті блоктар санын көрсетіңіз",
        "calc-step3-lbl": "3. Жеткізу:",
        "calc-del-opt1-title": "Цех манипуляторы (түсірумен)",
        "calc-del-opt1-sub": "Қала және облыс бойынша, логист нақты есептейді",
        "calc-del-opt2-title": "Цех қоймасынан өзі алып кету",
        "calc-del-opt2-sub": "Поддондарда тиегішпен тегін тиеп беру",
        "calc-res-title": "Смета және тапсырыс параметрлері",
        "calc-res-lbl-blocks": "Блоктар саны:",
        "calc-res-lbl-pallets": "Поддондар саны:",
        "calc-res-lbl-volume": "Қалаудың жалпы көлемі:",
        "calc-res-lbl-weight": "Жүктің шамамен салмағы:",
        "calc-res-lbl-trucks": "Көлік қажеттілігі:",
        "calc-res-lbl-total": "Соңғы құны:",
        "calc-res-btn": "<span>Жеңілдікті бағаны бекіту</span> <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg>",
        "calc-res-note": "🔒 Бағаны бекіту 14 күн бойы жарамды. Алдын ала төлемсіз!",
        "cat-tag": "ӨНІМДЕР АССОРТИМЕНТІ",
        "cat-title": "Өндірушіден шлакоблоктар каталогы",
        "cat-subtitle": "Барлық өнімдер ГОСТ 6133-99 талаптарына қатаң сәйкестікте жартылай құрғақ көлемдік вибропрестеу әдісімен жасалған.",
        "cat-filter-all": "Блоктардың барлық түрлері",
        "cat-filter-wall": "Қабырғалық (390×190×190)",
        "cat-filter-part": "Перделік (390×90×190)",
        "cat-filter-heavy": "Іргетастық және нығайтылған",
        "btn-order": "Тапсырыс беру",
        "card1-badge": "ХИТ ӨНІМ",
        "card1-title": "Қабырғалық 4 қуысты шлакоблок",
        "card2-badge": "ОҢТАЙЛЫ",
        "card2-title": "Қабырғалық 2 қуысты шлакоблок",
        "card3-badge": "ЖОҒАРЫ БЕРІКТІК",
        "card3-title": "Тұтас іргетастық шлакоблок",
        "card4-badge": "ПЕРДЕЛЕР ҮШІН",
        "card4-title": "Перделік шлакоблок (жартылай блок)",
        "card5-badge": "ЖЫЛЫ",
        "card5-title": "Керамзит-бетон жылы блок",
        "card6-badge": "ЭСТЕТИКА",
        "card6-title": "Сәндік «Жыртылған тас» блогы",
        "spec-lbl-size": "Өлшемі:",
        "spec-lbl-strength": "Беріктік маркасы:",
        "spec-lbl-hollow": "Қуыстылығы:",
        "spec-lbl-weight": "Блок салмағы:",
        "spec-lbl-pallet": "Поддонда:",
        "spec-lbl-frost": "Аязға шыдамдылығы:",
        "spec-lbl-sound": "Шу оқшаулауы:",
        "spec-lbl-thermal": "Жылу өткізгіштігі:",
        "spec-lbl-eco": "Экологиялылығы:",
        "spec-lbl-texture": "Фактурасы:",
        "spec-lbl-purpose": "Мақсаты:",
        "spec-lbl-colors": "Түстері:",
        "spec-v-hollow30": "30% (жылу сақтағыш)",
        "spec-v-hollow40": "40% (қалың қабырғалар)",
        "spec-v-hollow0": "0% (монолитті)",
        "spec-v-hollow2": "2 саңылаулы қуыс",
        "spec-v-pallet72": "72 дана (1 332 кг)",
        "spec-v-pallet72-2": "72 дана (1 440 кг)",
        "spec-v-pallet60": "60 дана (1 560 кг)",
        "spec-v-pallet144": "144 дана (1 440 кг)",
        "spec-v-pallet72-c": "72 дана (972 кг)",
        "spec-v-frost50": "F50 (50 циклдан бастап)",
        "spec-v-sound-hi": "Жоғары (48 дБ дейін)",
        "spec-v-eco-clay": "100% табиғи саз",
        "spec-v-texture-stone": "Жарылған беткі қыры",
        "spec-v-purp-found": "Цокольдар, іргетастар, тіреулер",
        "spec-v-purp-fence": "Қоршаулар, цокольдар, қасбеттер",
        "spec-v-colors": "Сұр, графит, шоколад",
        "unit-pallet-14040": "/ дана (14040 ₸/поддон)",
        "unit-pallet-14760": "/ дана (14760 ₸/поддон)",
        "unit-pallet-16500": "/ дана (16500 ₸/поддон)",
        "unit-pallet-20880": "/ дана (20880 ₸/поддон)",
        "unit-pallet-23400": "/ дана (23400 ₸/поддон)",
        "table-tag": "ТЕХНИКАЛЫҚ ДЕРЕКТЕР",
        "table-title": "ГОСТ 6133-99 бойынша блоктар сипаттамаларын салыстыру",
        "table-subtitle": "Заводіміздің әрбір партиясының зертханалық сынақтарының ресми көрсеткіштері.",
        "th-type": "Блок түрі",
        "th-dims": "Өлшемдері (мм)",
        "th-hollow": "Қуыстылығы",
        "th-strength": "Беріктік маркасы",
        "th-frost": "Аязға шыдамдылығы",
        "th-weight": "Салмағы (кг)",
        "th-pallet": "Поддонда (дана)",
        "tb-row1-type": "Қабырғалық 4 қуысты",
        "tb-row2-type": "Қабырғалық 2 қуысты",
        "tb-row3-type": "Тұтас іргетастық",
        "tb-row3-hollow": "0% (тұтас)",
        "tb-row4-type": "Перделік (жартылай блок)",
        "tb-row5-type": "Керамзит-бетон қабырғалық",
        "prod-tag": "ЦЕХ ТЕХНОЛОГИЯСЫ",
        "prod-title": "Бiз сенімді блоктарды қалай өндіреміз",
        "prod-subtitle": "Дұрыс вибропрестеу технологиясына үйіңіздің 70 жыл бойы жарықсыз тұруы байланысты.",
        "prod-banner-badge": "ТОЛЫҚ ЦИКЛДЫ ЦЕХ",
        "prod-banner-title": "«BLOCKMASTER» автоматтандырылған вибропрестеу желісі",
        "prod-banner-desc": "Цемент, су және фракциялық толтырғышты компьютерлік дозалау адам факторын жояды.",
        "prod-step1-title": "Шикізатты дайындау",
        "prod-step1-desc": "Жуылған гранит қиыршықтасы 0-5 мм және портландцемент М500. Сазсыз және қоқыссыз қатаң қоспа.",
        "prod-step2-title": "Вибропрестеу",
        "prod-step2-desc": "Максималды тығыздық үшін жоғары жиілікті тербеліспен 160 атмосфера қысымы астында матрицада престеу.",
        "prod-step3-title": "Булау камерасы",
        "prod-step3-desc": "70°C температурада бумен термоылғалды өңдеу. Блок 28 күннің орнына 24 сағатта маркалық беріктікке жетеді.",
        "prod-step4-title": "ТБК бақылауы және қойма",
        "prod-step4-desc": "Диагональдарды өлшеу, престе сынау, ұқыпты жеткізу үшін европоддондарға стретч-үлбірге орау.",
        "del-tag": "ЖЕКЕ АВТОПАРК",
        "del-title": "Тапсырыс берген күні манипулятормен жылдам жеткізу",
        "del-subtitle": "Поддондарды тікелей құрылыс алаңыңызға түсіреміз немесе екінші қабат жабынына көтеріп береміз.",
        "del-perk1-title": "5т, 10т және 20т манипуляторлар",
        "del-perk1-desc": "Тар көшелер немесе ірі құрылыс объектілері үшін қолайлы көлікті таңдаймыз.",
        "del-perk2-title": "Жебемен ұқыпты түсіру",
        "del-perk2-desc": "Самосвалмен аударып тастау жоқ — блоктар сынбайды және сызылмайды.",
        "del-perk3-title": "Аптасына 6 күн өзі алып кету",
        "del-perk3-desc": "Ашалы тиегішпен 15 минут ішінде тегін әрі жылдам тиеп беру.",
        "del-cta-text": "Елді мекеніңізге дейін жеткізудің нақты құнын біліңіз:",
        "del-cta-btn": "Жеткізуді есептеу",
        "truck1-badge": "ШАҒЫН МАНИПУЛЯТОР",
        "truck1-title": "КАМАЗ / ISUZU (5 тоннаға дейін)",
        "truck1-cap": "Сыйымдылығы: <strong>250 блокқа дейін (3–4 поддон)</strong>",
        "truck1-desc": "Қосымша құрылыстар, гараждар, қоршаулар және тар өткелдер үшін өте қолайлы.",
        "truck2-badge": "ЕҢ КӨП СҰРАНЫСҚА ИЕ",
        "truck2-title": "МАЗ / КАМАЗ (10–12 тоннаға дейін)",
        "truck2-cap": "Сыйымдылығы: <strong>650 блокқа дейін (8–9 поддон)</strong>",
        "truck2-desc": "Үйдің 1-қабатын немесе шаруашылық блогын салу үшін оңтайлы.",
        "truck3-badge": "АУЫР МАНИПУЛЯТОР",
        "truck3-title": "ҰЗЫН ӨЛШЕМДІ (20–25 тоннаға дейін)",
        "truck3-cap": "Сыйымдылығы: <strong>1 300 блокқа дейін (18 поддон)</strong>",
        "truck3-desc": "Ауқымды құрылыстар мен ең төменгі тариф бойынша көтерме жеткізілімдер үшін.",
        "rev-tag": "ШЫНАЙЫ ТӘЖІРИБЕ",
        "rev-title": "Құрылысшылар мен тапсырыс берушілер не дейді",
        "rev-subtitle": "Цех жұмыс істеген 7 жыл ішінде 1 200-ден астам салынған объектілер.",
        "rev1-author": "Алексей Новиков",
        "rev1-role": "Құрылыс бригадасының прорабы",
        "rev1-text": "«Осы цехтан қатарынан үшінші маусым алып жатырмыз. Негізгі артықшылығы — геометриясы. Жіктер 8 мм-ге дейін тегіс шығады, ерітінді минималды кетеді. Блоктар берік, тасымалдағанда сынбайды. Манипулятор жүргізушісі поддондарды іргетас периметріне өте шебер қойып берді.»",
        "rev1-object": "Объект: Коттедж 160 м² (2 800 блок)",
        "rev2-author": "Бахром Каримов",
        "rev2-role": "Жеке құрылысшы",
        "rev2-text": "«Мансардасы бар гараж салдым. Таңғы 9-да қоңырау шалдым, менеджер калькулятор арқылы өлшемдер бойынша есептеуге көмектесті. Сағат 14:00-де машина ауламда жүк түсіріп жатты. Жүргізушіге тексергеннен кейін төледім. Блоктар жаңа, ұрғанда сыңғырлайды, беріктігі өте жақсы!»",
        "rev2-object": "Объект: Гараж 7х9 м (950 блок)",
        "rev3-author": "Сергей Васильев",
        "rev3-role": "Қойма кешенінің бас мердігері",
        "rev3-text": "«Тұтас және 4 қуысты блоктардың үлкен партиясына (14 000 дана) тапсырыс бердік. Цех кестені дәлме-дәл орындады. Сапа паспорттары мен сынақ хаттамаларын қоса берді. Поддондарда ешқандай сынық жоқ. Сенімді тікелей өндіруші ретінде ұсынамын.»",
        "rev3-object": "Объект: Ангар-қойма 450 м² (14 000 блок)",
        "faq-tag": "СҰРАҚТАР МЕН ЖАУАПТАР",
        "faq-title": "Жиі қойылатын сұрақтар",
        "faq-subtitle": "Шлакоблоктар партиясына тапсырыс бермес бұрын білу керек барлық нәрсе.",
        "faq-q1": "1 м² және 1 м³ қалауға қанша шлакоблок кетеді?",
        "faq-a1": "Стандартты 390×190×190 мм өлшемде және 10 мм жік қалыңдығында:<br>• Жартылай блок қалыңдығындағы (19 см) қабырғаның 1 м² ауданына <strong>12.5 блок</strong> кіреді.<br>• Тұтас блок қалыңдығындағы (39 см) қабырғаның 1 м² ауданына <strong>25 блок</strong> кіреді.<br>• 1 м³ тұтас қалауға тура <strong>62.5 блок</strong> кіреді.",
        "faq-q2": "Бiр ағаш поддонға қанша блок сыяды?",
        "faq-a2": "Стандартты европоддонға <strong>72 дана</strong> қабырғалық блок сыяды (поддон салмағы шамамен 1.33 тонна) немесе <strong>144 дана</strong> перделік жартылай блоктар. Тұтас іргетастық блоктар салмағының үлкендігіне байланысты <strong>60 данадан</strong> жиналады.",
        "faq-q3": "Заводтық буланған блокты қолдан жасалған блоктан қалай ажыратуға болады?",
        "faq-a3": "Қолдан жасалған блоктар ашық күнде кептіріледі: олар ақшыл, шеттері саусақпен үгітіледі, геометриясы қисық (1–2 см-ге дейін айырмашылық), ұрғанда саңырау дыбыс шығарады. Камерадан шыққан заводтық блок біркелкі сұр түске, анық тік бұрыштарға ие болады, балғамен ұрғанда сыңғырлаған дыбыс шығарады және жарылмайды.",
        "faq-q4": "Алдын ала төлем қажет пе және төлем қалай жүзеге асырылады?",
        "faq-a4": "Жеке тұлғалар үшін стандартты көлемдегі тапсырыстарда <strong>алдын ала төлем талап етілмейді</strong>! Сіз жеткізуге тапсырыс бересіз, жүргізуші поддондарды әкеледі, сапасын тексересіз және орнында қолма-қол немесе аударым арқылы есептесесіз. Заңды тұлғалар үшін ҚҚС-пен/ҚҚС-сыз қолма-қолсыз төлем бар.",
        "faq-q5": "Көтерме саудаға жеңілдіктер қарастырылған ба?",
        "faq-a5": "Иә! 1 000 данадан бастап тапсырыс бергенде 3% жеңілдік, 3 000 данадан — 5%, 5 000 данадан бастап — арнайы баға және манипуляторға жеңілдікті тариф беріледі.",
        "cnt-form-badge": "ЖЕКЕ ЕСЕПТЕУ",
        "cnt-form-title": "Блоктарды жеткізуге өтінім қалдырыңыз",
        "cnt-form-desc": "Цех менеджері 10 минут ішінде сізбен хабарласып, бар-жоғын анықтайды және объектіңізге дейін жеткізуді есептейді.",
        "cnt-lbl-name": "Сіздің атыңыз:",
        "cnt-ph-name": "Асқар Нұрланов",
        "cnt-lbl-phone": "Телефон нөміріңіз:",
        "cnt-lbl-prod": "Сізді не қызықтырады:",
        "cnt-opt-wall4": "Қабырғалық 4 қуысты (390×190×190)",
        "cnt-opt-wall2": "Қабырғалық 2 қуысты (390×190×190)",
        "cnt-opt-solid": "Тұтас іргетастық (390×190×190)",
        "cnt-opt-part": "Перделік жартылай блоктар (390×90×190)",
        "cnt-opt-clay": "Керамзит-бетон блоктар",
        "cnt-opt-all": "Жоба бойынша толық есеп керек",
        "cnt-lbl-addr": "Жеткізу мекенжайы немесе ауданы (немесе өзі алып кету):",
        "cnt-ph-addr": "Мысалы: Абай даңғылы 45",
        "cnt-btn-submit": "<span>Есепті алу және жеңілдікті бекіту</span>",
        "cnt-privacy": "Түймені басу арқылы сіз жеке деректерді өңдеуге келісесіз. Біз спам жібермейміз.",
        "cnt-info-tag": "ДАЙЫН ӨНІМДЕР ЦЕХЫ ЖӘНЕ ҚОЙМАСЫ",
        "cnt-info-title": "Өндірісімізге келіп өтіңіз",
        "cnt-info-desc": "Сатып алмас бұрын блок үлгілерін жеке тексере аласыз, штангенциркульмен геометриясын және беріктігін бағалай аласыз.",
        "cnt-lbl-work-addr": "Өндіріс пен қойма мекенжайы:",
        "cnt-val-work-addr": "Өнеркәсіп аймағы, Заводской өткелі, №4 қойма",
        "cnt-lbl-hours": "Тиеу және жұмыс кестесі:",
        "cnt-val-hours": "Дүй – Сен: 08:00-ден 20:00-ге дейін<br>Жек: алдын ала келісім бойынша",
        "cnt-lbl-sales-phone": "Сату бөлімінің тікелей телефоны:",
        "cnt-phone-multi": "(көп арналы)",
        "cnt-lbl-messengers": "Жылдам байланыс үшін мессенджерлер:",
        "cnt-map-title": "«МОНОЛИТ-БЛОК» шлакоблок цехы",
        "cnt-map-desc": "Ұзын өлшемді көліктер мен Газельдер үшін қоршалған ыңғайлы кіру жолы, бетонды тиеу алаңы",
        "ft-about": "ГОСТ 6133-99 бойынша қабырғалық және перделік вибропрестелген шлакоблоктардың тікелей өндірушісі. Жеке және коммерциялық құрылыс үшін сенімді жеткізілімдер.",
        "ft-copy": "© 2026 «МОНОЛИТ-БЛОК» заводы. Барлық құқықтар қорғалған.",
        "ft-h-prod": "Өнімдер",
        "ft-p1": "Қабырғалық 4 қуысты",
        "ft-p2": "Қабырғалық 2 қуысты",
        "ft-p3": "Тұтас іргетастық",
        "ft-p4": "Перделік жартылай блоктар",
        "ft-p5": "Керамзит-бетон блоктар",
        "ft-p6": "Сәндік жарылған тастар",
        "ft-h-nav": "Навигация",
        "ft-n1": "Есептеу калькуляторы",
        "ft-n2": "Цех артықшылықтары",
        "ft-n3": "Технология және ГОСТ",
        "ft-n4": "Жеткізу шарттары",
        "ft-n5": "Клиенттер пікірлері",
        "ft-n6": "Қойма және байланыс",
        "ft-h-sales": "Сату қызметі",
        "ft-lbl-phone": "Телефон:",
        "ft-lbl-email": "Пошта:",
        "ft-lbl-addr": "Мекенжайы:",
        "ft-val-addr": "Өнеркәсіп аймағы, Заводской өткелі, 4",
        "ft-btn-call": "Қоңырауға тапсырыс беру",
        "modal-badge": "ЖЫЛДАМ ТАПСЫРЫС",
        "modal-title": "Өтінімді рәсімдеу",
        "modal-subtitle": "Байланыс деректерін толтырыңыз, біз растау үшін 10 минут ішінде хабарласамыз.",
        "modal-lbl-name": "Сіздің атыңыз:",
        "modal-ph-name": "Арман",
        "modal-lbl-phone": "Байланыс телефоны:",
        "modal-lbl-comment": "Түсініктеме / Жеткізу мекенжайы (міндетті емес):",
        "modal-ph-comment": "Жеткізу ауданын немесе қалаған күнді көрсетіңіз",
        "modal-btn": "<span>Өтінімді растау</span>",
        "modal-privacy": "Төлем тек объектіде тауарды алғаннан және тексергеннен кейін."
    }
};

function switchLang(lang) {
    currentLang = lang;

    // 1. Переключение кнопок в шапке
    const btnRU = document.getElementById('langRU');
    const btnKZ = document.getElementById('langKZ');
    if (btnRU) btnRU.classList.toggle('active', lang === 'ru');
    if (btnKZ) btnKZ.classList.toggle('active', lang === 'kz');

    // 2. Обновление атрибута lang на html
    const htmlRoot = document.getElementById('htmlRoot') || document.documentElement;
    htmlRoot.lang = lang;

    // 3. Заголовок страницы
    if (lang === 'kz') {
        document.title = 'МОНОЛИТ-БЛОК | ГОСТ шлакоблоктарын өндіру зауыты мен цехы';
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

    // 6. Поддержка элементов с data-ru / data-kz
    document.querySelectorAll('[data-ru]').forEach(el => {
        const val = lang === 'ru' ? el.getAttribute('data-ru') : (el.getAttribute('data-kz') || el.getAttribute('data-uz'));
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

    if (saved === 'kz' || saved === 'uz') {
        switchLang('kz');
    } else {
        switchLang('ru');
    }
}

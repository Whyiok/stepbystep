/* Shared page behavior. */
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    renderInstructions();
    initCategories();
    initStatCounters();
    initSmoothAnchors();
});

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu');
    const nav = document.getElementById('siteNav');
    if (!toggle || !nav) return;

    const close = () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Открыть меню');
    };
    toggle.addEventListener('click', () => {
        const open = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
}

function renderInstructions(category = 'all', query = '') {
    const grid = document.getElementById('instructionsGrid');
    if (!grid || !window.StepByStepData) return;
    const normalized = query.trim().toLocaleLowerCase('ru');
    const items = window.StepByStepData.getAll().filter(item => {
        const matchesCategory = category === 'all' || item.category === category;
        const searchable = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.author || ''}`.toLocaleLowerCase('ru');
        return matchesCategory && (!normalized || searchable.includes(normalized));
    });
    grid.replaceChildren();
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Ничего не найдено. Попробуйте изменить запрос или выбрать другую категорию.';
        grid.appendChild(empty);
        return;
    }
    items.forEach(item => grid.appendChild(createInstructionCard(item)));
}

function createInstructionCard(item) {
    const card = document.createElement('article');
    card.className = 'instruction-card';
    const link = document.createElement('a');
    link.className = 'instruction-card-link';
    link.href = `instruction.html?id=${encodeURIComponent(item.id)}`;
    link.setAttribute('aria-label', `Открыть инструкцию: ${item.title}`);

    const image = document.createElement('div');
    image.className = 'instruction-image';
    image.setAttribute('aria-hidden', 'true');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.classList.add('icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#icon-${categoryIcon(item.category)}`);
    icon.appendChild(use);
    image.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'instruction-content';
    const title = document.createElement('h3');
    title.className = 'instruction-title';
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'instruction-description';
    description.textContent = item.description;
    const meta = document.createElement('div');
    meta.className = 'instruction-meta';
    [item.difficulty || 'Средняя', item.time || '—', `${item.steps?.length || 0} шага`].forEach(value => {
        const span = document.createElement('span');
        span.textContent = value;
        meta.appendChild(span);
    });
    content.append(title, description, meta);
    link.append(image, content);
    card.appendChild(link);
    return card;
}

function categoryIcon(category) {
    return ({ tech: 'laptop-code', study: 'book-open', diy: 'tools', office: 'file', cooking: 'utensils', health: 'heart-pulse' })[category] || 'checklist';
}

function initCategories() {
    const cards = document.querySelectorAll('.category-card[data-category]');
    if (!cards.length) return;
    cards.forEach(card => {
        card.setAttribute('aria-pressed', 'false');
        card.addEventListener('click', () => {
            activateCategory(card);
        });
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activateCategory(card);
            }
        });
    });
}

function activateCategory(card) {
    const cards = document.querySelectorAll('.category-card[data-category]');
    const selected = card.getAttribute('aria-pressed') === 'true';
    cards.forEach(item => item.setAttribute('aria-pressed', 'false'));
    if (!selected) card.setAttribute('aria-pressed', 'true');
    const category = selected ? 'all' : card.dataset.category;
    renderInstructions(category, document.getElementById('searchInput')?.value || '');
    const status = document.getElementById('catalogStatus');
    if (status) status.textContent = selected ? 'Показаны все инструкции' : `Фильтр: ${card.querySelector('h3')?.textContent || category}`;
    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initStatCounters() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.stat-number[data-count]').forEach(el => { el.textContent = Number(el.dataset.count).toLocaleString('ru-RU'); });
        return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count) || 0;
        const start = performance.now();
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
        const tick = now => {
            const progress = duration ? Math.min((now - start) / duration, 1) : 1;
            el.textContent = Math.round(target * progress).toLocaleString('ru-RU');
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
    }), { threshold: 0.35 });
    document.querySelectorAll('.stat-number[data-count]').forEach(el => observer.observe(el));
}

function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
        const href = link.getAttribute('href');
        if (!href || href === '#') { event.preventDefault(); return; }
        const target = document.querySelector(href);
        if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }));
}

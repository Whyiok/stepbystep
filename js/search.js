/* Search suggestions for the shared local catalog. */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('searchInput');
    const bar = input?.closest('.search-bar');
    if (!input || !bar) return;

    input.setAttribute('aria-label', 'Поиск инструкций');
    input.setAttribute('aria-expanded', 'false');
    const results = document.createElement('div');
    results.className = 'search-results';
    results.id = 'searchResults';
    results.hidden = true;
    results.setAttribute('role', 'listbox');
    input.setAttribute('aria-controls', results.id);
    bar.appendChild(results);

    let timeout;
    const hide = () => { results.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    const search = () => {
        const query = input.value.trim().toLocaleLowerCase('ru');
        if (!query || !window.StepByStepData) { hide(); return; }
        const matches = window.StepByStepData.getAll().filter(item => `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('ru').includes(query)).slice(0, 6);
        results.replaceChildren();
        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'search-empty';
            empty.textContent = 'Ничего не найдено';
            results.appendChild(empty);
        } else {
            matches.forEach(item => {
                const link = document.createElement('a');
                link.className = 'search-result-item';
                link.href = `instruction.html?id=${encodeURIComponent(item.id)}`;
                link.setAttribute('role', 'option');
                const title = document.createElement('strong');
                title.textContent = item.title;
                const description = document.createElement('span');
                description.textContent = item.description;
                link.append(title, description);
                results.appendChild(link);
            });
        }
        results.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    };
    input.addEventListener('input', () => { clearTimeout(timeout); timeout = setTimeout(search, 160); });
    input.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
    document.addEventListener('click', event => { if (!bar.contains(event.target)) hide(); });
    input.addEventListener('focus', () => { if (input.value.trim()) search(); });
});

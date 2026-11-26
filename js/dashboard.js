document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('myInstructions');
    if (!list || !window.StepByStepData) return;
    const search = document.querySelector('.search-box input');
    const filter = document.querySelector('.filter-select');
    const localItems = window.StepByStepData.readLocal();
    let pendingDelete = null;

    const count = document.getElementById('dashboardInstructionCount');
    if (count) count.textContent = localItems.length;
    const viewCount = document.getElementById('dashboardViews');
    if (viewCount) viewCount.textContent = '—';
    const rating = document.getElementById('dashboardRating');
    if (rating) rating.textContent = '—';

    const render = () => {
        const query = (search?.value || '').trim().toLocaleLowerCase('ru');
        const status = filter?.value || 'all';
        const matches = window.StepByStepData.readLocal().filter(item => {
            const text = `${item.title} ${item.description}`.toLocaleLowerCase('ru');
            return (!query || text.includes(query)) && (status === 'all' || status === 'published');
        });
        list.replaceChildren();
        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state dashboard-empty';
            const heading = document.createElement('h2');
            heading.textContent = query ? 'Ничего не найдено' : 'Пока нет своих инструкций';
            const text = document.createElement('p');
            text.textContent = query ? 'Попробуйте изменить запрос.' : 'Создайте первую инструкцию — она сохранится в этом браузере.';
            const link = document.createElement('a');
            link.className = 'btn btn-primary';
            link.href = 'create.html';
            link.textContent = 'Создать инструкцию';
            empty.append(heading, text, link);
            list.appendChild(empty);
            return;
        }
        matches.forEach(item => {
            const card = document.createElement('article');
            card.className = 'dashboard-instruction-card';
            const copy = document.createElement('div');
            copy.className = 'dashboard-card-copy';
            const title = document.createElement('h3');
            title.textContent = item.title;
            const description = document.createElement('p');
            description.textContent = item.description;
            const meta = document.createElement('span');
            meta.className = 'dashboard-card-meta';
            meta.textContent = `${item.steps?.length || 0} шагов · ${item.time || 'Время не указано'} · ${item.difficulty || 'Средняя'}`;
            copy.append(title, description, meta);
            const actions = document.createElement('div');
            actions.className = 'dashboard-card-actions';
            const open = document.createElement('a');
            open.className = 'btn btn-outline';
            open.href = `instruction.html?id=${encodeURIComponent(item.id)}`;
            open.textContent = 'Открыть';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'btn btn-danger';
            remove.textContent = 'Удалить';
            remove.addEventListener('click', () => {
                pendingDelete = String(item.id);
                const titleNode = document.getElementById('deleteInstructionTitle');
                if (titleNode) titleNode.textContent = item.title;
                const modal = document.getElementById('deleteModal');
                if (modal) { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); }
            });
            actions.append(open, remove);
            card.append(copy, actions);
            list.appendChild(card);
        });
    };

    search?.addEventListener('input', render);
    filter?.addEventListener('change', render);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
        if (pendingDelete && window.StepByStepData.remove(pendingDelete)) {
            pendingDelete = null;
            document.getElementById('deleteModal')?.classList.remove('is-open');
            render();
            if (count) count.textContent = window.StepByStepData.readLocal().length;
        }
    });
    const closeModal = () => {
        const modal = document.getElementById('deleteModal');
        modal?.classList.remove('is-open');
        modal?.setAttribute('aria-hidden', 'true');
        pendingDelete = null;
    };
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeModal);
    document.querySelector('#deleteModal .modal-close')?.addEventListener('click', closeModal);
    document.getElementById('deleteModal')?.addEventListener('click', event => { if (event.target.id === 'deleteModal') closeModal(); });
    render();
});

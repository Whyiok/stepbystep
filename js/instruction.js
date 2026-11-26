/* Step runner: progress, checklists, notes and comments stay local to this browser. */
let activeInstruction = null;
let progressState = null;
let currentIndex = 0;

const demoComments = [
    { author: 'Иван Петров', content: 'Полезно заранее проверить совместимость сокета процессора и материнской платы.', time: 'Недавно', likes: 5 },
    { author: 'Мария Сидорова', content: 'Добавьте себе немного времени на повторную проверку соединений перед запуском.', time: 'Ранее', likes: 3 }
];

const readJSON = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch (error) { return fallback; }
};
const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
};

function storageKey(kind) { return `stepbystep.${kind}.${activeInstruction.id}`; }
function toast(message) {
    let node = document.querySelector('.toast-message');
    if (!node) { node = document.createElement('div'); node.className = 'toast-message'; node.setAttribute('role', 'status'); document.body.appendChild(node); }
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function loadProgress() {
    const saved = readJSON(storageKey('progress'), {});
    const count = activeInstruction.steps.length;
    const completed = Array.from({ length: count }, (_, i) => Boolean(saved.completed?.[i]));
    const checked = Array.from({ length: count }, (_, i) => Array.isArray(saved.checked?.[i]) ? saved.checked[i] : []);
    return { completed, checked, currentIndex: Math.max(0, Math.min(Number(saved.currentIndex) || 0, count - 1)) };
}
function saveProgress(showMessage = false) {
    progressState.currentIndex = currentIndex;
    const ok = writeJSON(storageKey('progress'), progressState);
    if (showMessage) toast(ok ? 'Прогресс сохранён в этом браузере.' : 'Не удалось сохранить прогресс.');
    renderProgress();
}
function renderProgress() {
    const done = progressState.completed.filter(Boolean).length;
    const percent = Math.round(done / activeInstruction.steps.length * 100);
    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressPercent');
    if (bar) bar.style.width = `${percent}%`;
    document.getElementById('progressTrack')?.setAttribute('aria-valuenow', String(percent));
    if (label) label.textContent = `${percent}%`;
}

function loadInstruction() {
    const id = new URLSearchParams(window.location.search).get('id') || '1';
    activeInstruction = window.StepByStepData?.getById(id);
    const title = document.getElementById('instructionTitle');
    if (!activeInstruction || !Array.isArray(activeInstruction.steps) || !activeInstruction.steps.length) {
        if (title) title.textContent = 'Инструкция не найдена';
        const content = document.getElementById('stepContent');
        if (content) content.textContent = 'Вернитесь в каталог и выберите доступную инструкцию.';
        document.getElementById('stepTitle').textContent = 'Нет данных';
        document.getElementById('stepsList')?.replaceChildren();
        document.querySelectorAll('#prevStepBtn, #nextStepBtn, #markCompleteBtn, #completeBtn, #saveProgressBtn').forEach(button => { button.disabled = true; });
        return;
    }

    document.title = `${activeInstruction.title} — StepByStep`;
    title.textContent = activeInstruction.title;
    document.getElementById('authorName').textContent = activeInstruction.author || 'Автор';
    document.getElementById('difficultyLevel').textContent = activeInstruction.difficulty || 'Средняя';
    document.getElementById('estimatedTime').textContent = activeInstruction.time || '—';
    document.getElementById('completedCount').textContent = Number(activeInstruction.completed || 0).toLocaleString('ru-RU');
    document.getElementById('ratingValue').textContent = activeInstruction.rating == null ? '—' : activeInstruction.rating;
    document.getElementById('totalSteps').textContent = activeInstruction.steps.length;
    progressState = loadProgress();
    currentIndex = progressState.currentIndex;

    renderStepList();
    renderCurrentStep();
    renderComments();
    renderProgress();
    initStepNavigation();
    initActionButtons();
    initComments();
    initNotes();
}

function renderStepList() {
    const list = document.getElementById('stepsList');
    list.replaceChildren();
    activeInstruction.steps.forEach((step, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'step-item';
        button.dataset.index = String(index);
        button.setAttribute('aria-current', index === currentIndex ? 'step' : 'false');
        if (progressState.completed[index]) button.classList.add('completed');
        if (index === currentIndex) button.classList.add('active');
        const mark = document.createElement('span');
        mark.className = 'step-checkbox';
        mark.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.className = 'step-content';
        const number = document.createElement('span');
        number.className = 'step-number';
        number.textContent = `Шаг ${index + 1}`;
        const name = document.createElement('span');
        name.className = 'step-title';
        name.textContent = step.title || `Шаг ${index + 1}`;
        text.append(number, name);
        button.append(mark, text);
        button.addEventListener('click', () => goToStep(index));
        list.appendChild(button);
    });
}

function renderCurrentStep() {
    const step = activeInstruction.steps[currentIndex];
    document.getElementById('currentStepNumber').textContent = String(currentIndex + 1);
    document.getElementById('stepTitle').textContent = step.title || `Шаг ${currentIndex + 1}`;
    const content = document.getElementById('stepContent');
    content.replaceChildren();
    const description = document.createElement('p');
    description.className = 'step-description';
    description.textContent = step.description || 'Выполните действие и отметьте результат.';
    content.appendChild(description);
    if (Array.isArray(step.details) && step.details.length) {
        const list = document.createElement('ul');
        list.className = 'step-details';
        step.details.forEach(detail => { const item = document.createElement('li'); item.textContent = detail; list.appendChild(item); });
        content.appendChild(list);
    }
    if (step.materials) {
        const materials = document.createElement('p');
        materials.className = 'step-materials-note';
        materials.textContent = `Материалы: ${step.materials}`;
        content.appendChild(materials);
    }
    renderChecklist(step);
    renderStepList();
    renderProgress();
    document.getElementById('prevStepBtn').disabled = currentIndex === 0;
    document.getElementById('nextStepBtn').textContent = currentIndex === activeInstruction.steps.length - 1 ? 'Завершить' : 'Дальше';
    renderComments();
    saveProgress(false);
}

function renderChecklist(step) {
    const container = document.getElementById('stepChecklist');
    container.replaceChildren();
    const items = Array.isArray(step.checklist) ? step.checklist : [];
    if (!items.length) { container.hidden = true; return; }
    container.hidden = false;
    const heading = document.createElement('h3');
    heading.textContent = 'Чек-лист шага';
    const list = document.createElement('div');
    list.className = 'checklist-items';
    items.forEach((text, itemIndex) => {
        const label = document.createElement('label');
        label.className = 'checklist-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'checklist-checkbox';
        input.checked = Boolean(progressState.checked[currentIndex][itemIndex]);
        const span = document.createElement('span');
        span.className = 'checklist-text';
        span.textContent = text;
        label.append(input, span);
        if (input.checked) label.classList.add('completed');
        input.addEventListener('change', () => {
            progressState.checked[currentIndex][itemIndex] = input.checked;
            label.classList.toggle('completed', input.checked);
            if (items.length && progressState.checked[currentIndex].filter(Boolean).length >= items.length) {
                progressState.completed[currentIndex] = true;
            } else if (!input.checked) {
                progressState.completed[currentIndex] = false;
            }
            saveProgress(false);
            renderStepList();
        });
        list.appendChild(label);
    });
    container.append(heading, list);
}

function initStepNavigation() {
    document.getElementById('prevStepBtn').addEventListener('click', () => goToStep(Math.max(0, currentIndex - 1)));
    document.getElementById('nextStepBtn').addEventListener('click', goToNextStep);
    document.getElementById('markCompleteBtn').addEventListener('click', () => {
        progressState.completed[currentIndex] = true;
        saveProgress(false);
        renderStepList();
        if (currentIndex < activeInstruction.steps.length - 1) goToStep(currentIndex + 1);
        else if (progressState.completed.every(Boolean)) showCompletionMessage();
        else toast('Шаг отмечен. Проверьте оставшиеся шаги.');
    });
}
function goToStep(index) {
    if (index < 0 || index >= activeInstruction.steps.length) return;
    currentIndex = index;
    progressState.currentIndex = index;
    renderCurrentStep();
}
function goToNextStep() {
    if (currentIndex < activeInstruction.steps.length - 1) { goToStep(currentIndex + 1); return; }
    if (progressState.completed.every(Boolean)) showCompletionMessage();
    else toast('Отметьте шаги выполненными, чтобы завершить инструкцию.');
}

function initActionButtons() {
    document.getElementById('saveProgressBtn').addEventListener('click', () => saveProgress(true));
    document.getElementById('completeBtn').addEventListener('click', () => {
        if (progressState.completed.every(Boolean)) showCompletionMessage();
        else toast('Сначала отметьте все шаги выполненными.');
    });
    document.getElementById('forkBtn').addEventListener('click', () => toast('Функция копирования появится после подключения сервера.'));
    document.getElementById('reportBtn').addEventListener('click', () => toast('Отправка обращений пока не подключена в демо-версии.'));
    document.getElementById('commentBtn').addEventListener('click', () => document.getElementById('commentInput').focus());
}

function showCompletionMessage() {
    if (document.querySelector('.completion-modal')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal is-open completion-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'completionTitle');
    const panel = document.createElement('div');
    panel.className = 'modal-content';
    const heading = document.createElement('h2');
    heading.id = 'completionTitle';
    heading.textContent = 'Инструкция пройдена';
    const message = document.createElement('p');
    message.textContent = `Готово — вы завершили «${activeInstruction.title}». Прогресс сохранён в этом браузере.`;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn-primary';
    close.textContent = 'Продолжить';
    close.addEventListener('click', () => overlay.remove());
    panel.append(heading, message, close);
    overlay.appendChild(panel);
    overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    close.focus();
}

function renderComments() {
    const list = document.getElementById('commentsList');
    if (!list || !activeInstruction) return;
    const key = storageKey(`comments.${currentIndex}`);
    const saved = readJSON(key, null);
    const comments = Array.isArray(saved) ? saved : (String(activeInstruction.id) === '1' && currentIndex === 0 ? demoComments : []);
    list.replaceChildren();
    if (!comments.length) {
        const empty = document.createElement('p');
        empty.className = 'comment-empty';
        empty.textContent = 'Пока нет комментариев к этому шагу.';
        list.appendChild(empty);
        return;
    }
    comments.forEach((comment, index) => {
        const article = document.createElement('article');
        article.className = 'comment';
        const header = document.createElement('div');
        header.className = 'comment-header';
        const author = document.createElement('strong');
        author.textContent = comment.author || 'Пользователь';
        const time = document.createElement('span');
        time.className = 'comment-time';
        time.textContent = comment.time || 'Сейчас';
        header.append(author, time);
        const body = document.createElement('p');
        body.className = 'comment-content';
        body.textContent = comment.content || '';
        const like = document.createElement('button');
        like.type = 'button';
        like.className = 'comment-action';
        like.textContent = `Полезно (${Number(comment.likes) || 0})`;
        like.addEventListener('click', () => {
            const current = readJSON(key, comments);
            if (!Array.isArray(current) || !current[index]) return;
            current[index].likes = (Number(current[index].likes) || 0) + 1;
            writeJSON(key, current);
            renderComments();
        });
        article.append(header, body, like);
        list.appendChild(article);
    });
}
function initComments() {
    const input = document.getElementById('commentInput');
    const submit = document.getElementById('submitCommentBtn');
    const add = () => {
        const content = input.value.trim();
        if (!content) { input.focus(); return; }
        const key = storageKey(`comments.${currentIndex}`);
        const saved = readJSON(key, String(activeInstruction.id) === '1' && currentIndex === 0 ? demoComments : []);
        saved.unshift({ author: 'Вы', content, time: 'Только что', likes: 0 });
        if (!writeJSON(key, saved)) { toast('Не удалось сохранить комментарий.'); return; }
        input.value = '';
        renderComments();
        toast('Комментарий добавлен.');
    };
    submit.addEventListener('click', add);
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) add(); });
}

function initNotes() {
    const modal = document.getElementById('noteModal');
    const textarea = document.getElementById('noteTextarea');
    const close = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); };
    document.getElementById('addNoteBtn').addEventListener('click', () => {
        textarea.value = readJSON(storageKey(`note.${currentIndex}`), '');
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        textarea.focus();
    });
    document.getElementById('closeNoteModal').addEventListener('click', close);
    document.getElementById('cancelNoteBtn').addEventListener('click', close);
    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        if (!writeJSON(storageKey(`note.${currentIndex}`), textarea.value.trim())) { toast('Не удалось сохранить заметку.'); return; }
        close();
        toast('Заметка сохранена в этом браузере.');
    });
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
}

document.addEventListener('DOMContentLoaded', () => loadInstruction());

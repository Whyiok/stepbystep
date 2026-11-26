document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createForm');
    const container = document.getElementById('stepsContainer');
    const addButton = document.getElementById('addStepBtn');
    if (!form || !container || !addButton) return;

    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);
    let nextStepId = 0;

    const updateNumbers = () => container.querySelectorAll('.step-item').forEach((step, index) => {
        const label = step.querySelector('.step-number-label');
        if (label) label.textContent = `Шаг ${index + 1}`;
        const remove = step.querySelector('.remove-step');
        if (remove) remove.disabled = container.children.length <= 1;
    });

    const addStep = (focusTitle = true) => {
        if (container.children.length >= 20) {
            status.textContent = 'Можно добавить не более 20 шагов.';
            return;
        }
        const index = ++nextStepId;
        const card = document.createElement('section');
        card.className = 'step-item create-step';
        const header = document.createElement('div');
        header.className = 'step-header';
        const number = document.createElement('strong');
        number.className = 'step-number-label';
        number.textContent = `Шаг ${index}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-step';
        remove.textContent = 'Удалить шаг';
        remove.setAttribute('aria-label', `Удалить шаг ${index}`);
        remove.addEventListener('click', () => { card.remove(); updateNumbers(); });
        header.append(number, remove);

        const titleId = `step-title-${index}`;
        const descriptionId = `step-description-${index}`;
        const materialId = `step-materials-${index}`;
        const fields = [
            ['Название шага', 'input', 'step-title', 'Например: Подготовьте рабочее место', titleId],
            ['Описание шага', 'textarea', 'step-description', 'Кратко объясните, что нужно сделать', descriptionId],
            ['Материалы (необязательно)', 'input', 'step-materials', 'Ссылка или дополнительная заметка', materialId]
        ];
        card.appendChild(header);
        fields.forEach(([labelText, tag, className, placeholder, id]) => {
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.htmlFor = id;
            label.textContent = labelText;
            const control = document.createElement(tag);
            control.id = id;
            control.className = className;
            control.placeholder = placeholder;
            if (tag === 'input') control.type = 'text';
            if (className !== 'step-materials') control.required = true;
            group.append(label, control);
            card.appendChild(group);
        });
        container.appendChild(card);
        updateNumbers();
        if (focusTitle) card.querySelector('.step-title')?.focus();
    };

    addButton.addEventListener('click', () => addStep(true));
    addStep(false);

    form.addEventListener('submit', event => {
        event.preventDefault();
        status.textContent = '';
        if (!form.reportValidity()) return;
        const steps = [...container.querySelectorAll('.step-item')].map(step => ({
            title: step.querySelector('.step-title').value.trim(),
            description: step.querySelector('.step-description').value.trim(),
            materials: step.querySelector('.step-materials').value.trim(),
            details: [],
            checklist: []
        }));
        if (!steps.length || steps.some(step => !step.title || !step.description)) {
            status.textContent = 'Добавьте название и описание для каждого шага.';
            return;
        }
        const category = document.getElementById('category').value;
        const instruction = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: document.getElementById('title').value.trim(),
            category,
            description: document.getElementById('description').value.trim(),
            time: `${document.getElementById('time').value} мин`,
            difficulty: document.getElementById('difficulty').value,
            author: 'Вы',
            completed: 0,
            rating: null,
            steps,
            createdAt: new Date().toISOString()
        };
        if (!window.StepByStepData?.save(instruction)) {
            status.textContent = 'Не удалось сохранить в браузере. Проверьте свободное место или настройки хранилища.';
            return;
        }
        window.location.href = 'dashboard.html?created=1';
    });
});

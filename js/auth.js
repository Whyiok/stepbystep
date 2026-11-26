document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm') || document.getElementById('registerForm');
    if (!form) return;
    const isRegister = form.id === 'registerForm';
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);

    const password = document.getElementById('password');
    const confirmation = document.getElementById('confirmPassword');
    if (password && isRegister) {
        password.autocomplete = 'new-password';
        confirmation.autocomplete = 'new-password';
        password.addEventListener('input', () => {
            const score = [password.value.length >= 8, /[A-ZА-Я]/.test(password.value), /[a-zа-я]/.test(password.value), /\d/.test(password.value), /[^\p{L}\p{N}]/u.test(password.value)].filter(Boolean).length;
            const fill = document.getElementById('strengthFill');
            const label = document.getElementById('strengthText');
            if (fill) { fill.style.width = `${Math.min(score, 5) * 20}%`; fill.dataset.level = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak'; }
            if (label) label.textContent = score >= 4 ? 'Надёжный' : score >= 3 ? 'Средний' : 'Слабый';
        });
    }
    form.addEventListener('submit', event => {
        event.preventDefault();
        status.textContent = '';
        if (!form.reportValidity()) return;
        if (isRegister && password.value !== confirmation.value) {
            status.textContent = 'Пароли не совпадают.';
            confirmation.focus();
            return;
        }
        status.textContent = 'Форма заполнена. Серверная авторизация в этой демо-версии не подключена; пароль не сохраняется.';
    });
    document.querySelectorAll('.btn-social').forEach(button => button.addEventListener('click', () => {
        status.textContent = 'Вход через сторонние сервисы пока не подключён.';
    }));
    document.getElementById('forgotPasswordLink')?.addEventListener('click', event => {
        event.preventDefault();
        status.textContent = 'Сброс пароля станет доступен после подключения серверной авторизации.';
    });
});

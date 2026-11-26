"""Small local web server for the StepByStep static prototype."""
from datetime import date
from pathlib import Path

from flask import Flask, abort, render_template, send_from_directory

ROOT = Path(__file__).resolve().parent
PAGES = {
    "index.html", "login.html", "register.html", "dashboard.html",
    "create.html", "instruction.html",
}
app = Flask(__name__, static_folder=None, template_folder=str(ROOT))
app.jinja_env.trim_blocks = True    # без пустых строк после {% ... %}
app.jinja_env.lstrip_blocks = True


@app.context_processor
def inject_globals():
    """Переменные, доступные во всех шаблонах."""
    return {"current_year": date.today().year}


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/<name>", endpoint="page")
def serve_page(name: str):
    """Отдаём только известные страницы; base.html и partials/ напрямую недоступны."""
    if name not in PAGES:
        abort(404)
    return render_template(name)


@app.get("/<any(css, js):folder>/<path:filename>", endpoint="asset")
def serve_asset(folder: str, filename: str):
    """Отдаём только css/*.css и js/*.js; файлы данных проекта наружу не выходят."""
    if Path(filename).suffix.lower() != f".{folder}":
        abort(404)
    return send_from_directory(ROOT / folder, filename)


if __name__ == "__main__":
    print("StepByStep запущен: http://127.0.0.1:5000")
    print("Остановка: Ctrl+C")
    app.run(debug=False, host="127.0.0.1", port=5000)

import mimetypes
import os

from dotenv import load_dotenv
from flask import Flask, render_template, request, send_from_directory

from log_sender import log, start_background_flush

load_dotenv()

# O sistema operacional pode não ter .otf mapeado (ex.: imagem Debian do
# Docker), fazendo o Flask servir a fonte como application/octet-stream —
# alguns navegadores recusam @font-face nesse caso. Registrar explicitamente
# garante o mesmo Content-Type em qualquer ambiente.
mimetypes.add_type("font/otf", ".otf")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

_debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"

# Com o reloader do Flask (debug=True) o processo "watcher" também importa
# este módulo; só inicia a thread de flush no processo que de fato serve
# requisições (WERKZEUG_RUN_MAIN) para não duplicá-la. Sob gunicorn ou
# debug=False não há reloader, então inicia direto.
if not _debug or os.getenv("WERKZEUG_RUN_MAIN") == "true":
    start_background_flush()


@app.route("/service-worker.js")
def service_worker():
    # Precisa ser servido a partir da raiz (não de /static/) para o
    # service worker ter escopo sobre o site inteiro, não só /static/.
    return send_from_directory(
        os.path.join(app.static_folder, "js"),
        "service-worker.js",
        mimetype="application/javascript",
    )


@app.route("/")
def index():
    log("SERVIDOR_INDEX", tags=["servidor"])
    return render_template("index.html")


@app.route("/termos")
def termos():
    log("SERVIDOR_TERMOS", tags=["servidor"])
    return render_template("termos.html")


@app.route("/posicione")
def posicione():
    log("SERVIDOR_POSICIONE", tags=["servidor"])
    return render_template("posicione.html")


@app.route("/qrfoto")
def qrfoto():
    image_url = request.args.get("imageUrl", "")
    log("SERVIDOR_QRFOTO", tags=["servidor", "foto"], data={"image_url": image_url})
    return render_template("qrfoto.html")


@app.route("/foto")
def foto():
    image_id = request.args.get("id", "")
    log("SERVIDOR_FOTO", tags=["servidor", "foto"], data={"image_id": image_id})
    return render_template("foto.html")


@app.route("/obrigado")
def obrigado():
    log("SERVIDOR_OBRIGADO", tags=["servidor"])
    return render_template("obrigado.html")


@app.route("/resultado")
def resultado():
    log("SERVIDOR_RESULTADO", tags=["servidor"])
    return render_template("resultado.html")


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", 5000)),
        debug=_debug,
    )

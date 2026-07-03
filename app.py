import os

from dotenv import load_dotenv
from flask import Flask, render_template, request

from log_sender import log, start_background_flush

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")


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


@app.route("/obrigado")
def obrigado():
    log("SERVIDOR_OBRIGADO", tags=["servidor"])
    return render_template("obrigado.html")


@app.route("/resultado")
def resultado():
    log("SERVIDOR_RESULTADO", tags=["servidor"])
    return render_template("resultado.html")


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    if not debug or os.getenv("WERKZEUG_RUN_MAIN") == "true":
        start_background_flush()

    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", 5000)),
        debug=debug,
    )

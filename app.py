import os

from dotenv import load_dotenv
from flask import Flask, render_template

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/termos")
def termos():
    return render_template("termos.html")


@app.route("/posicione")
def posicione():
    return render_template("posicione.html")


@app.route("/qrfoto")
def qrfoto():
    return render_template("qrfoto.html")


@app.route("/obrigado")
def obrigado():
    return render_template("obrigado.html")


@app.route("/resultado")
def resultado():
    return render_template("resultado.html")


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", "true").lower() == "true",
    )

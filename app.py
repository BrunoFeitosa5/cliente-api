from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from database.db import init_db
from routes.clientes import clientes_bp
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

app.config["JWT_SECRET_KEY"] = "minha-chave-secreta"
jwt = JWTManager(app)

with app.app_context():
    init_db()

app.register_blueprint(clientes_bp)


# Página principal
@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")


# Painel
@app.route("/painel")
def painel():
    return send_from_directory("frontend", "index.html")


# Arquivos do frontend
@app.route("/<path:arquivo>")
def arquivos_front(arquivo):
    return send_from_directory("frontend", arquivo)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
from flask import Flask, render_template
from flask_jwt_extended import JWTManager
from database.db import init_db
from routes.clientes import clientes_bp
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"] = "minha-chave-secreta"
jwt = JWTManager(app)

# banco
with app.app_context():
    init_db()

# rotas API
app.register_blueprint(clientes_bp)

# =========================
# PAINEL WEB
# =========================
@app.route("/")
def home():
    return {"status": "API rodando com sucesso 🚀"}

@app.route("/painel")
def painel():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
    
  
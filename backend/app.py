from flask import Flask
from flask_cors import CORS
from config import Config
from routes.tasks import tasks_bp

app = Flask(__name__)

CORS(app, origins=[Config.FRONTEND_URL], supports_credentials=True)

app.register_blueprint(tasks_bp)

@app.route("/")
def health_check():
    return {"status": "backend is running"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
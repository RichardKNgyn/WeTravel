#app.py 

from flask import Flask
from flask_cors import CORS 
from config import Config
from database import db
from routes.auth_routes import auth

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)

app.register_blueprint(auth, url_prefix="/auth")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

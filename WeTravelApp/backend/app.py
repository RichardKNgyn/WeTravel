from flask import Flask, jsonify
from models import db
from routes import api
import os

app = Flask(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///wetravel.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv(
    'SECRET_KEY', 'dev-secret-key'
)

# ============================================================================
# INITIALIZATION
# ============================================================================

db.init_app(app)
app.register_blueprint(api, url_prefix='/api')


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/')
def home():
    return jsonify({
        'message': 'WeTravel API running',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/register, /api/login, /api/logout, /api/me',
            'trips': '/api/trips, /api/trips/<id>, /api/trips/<id>/stops',
            'posts': '/api/posts',
            'destinations': '/api/saved-destinations',
            'sync': '/api/offline/bootstrap'
        }
    })


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

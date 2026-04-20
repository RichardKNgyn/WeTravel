from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Post, Trip, TripStop, SavedDestination, User

api = Blueprint('api', __name__)


def get_current_user_id():
    return session.get('user_id')


def require_auth():
    user_id = get_current_user_id()
    if not user_id:
        return None, (jsonify({'error': 'Not authenticated'}), 401)
    return user_id, None


# ============================================================================
# AUTH ROUTES
# ============================================================================

@api.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id
    return jsonify(user.to_dict()), 201


@api.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    session['user_id'] = user.id
    return jsonify(user.to_dict())


@api.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out'})


@api.route('/me', methods=['GET'])
def me():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


# ============================================================================
# OFFLINE SYNC ENDPOINT - Returns complete offline cache
# ============================================================================

@api.route('/offline/bootstrap', methods=['GET'])
def bootstrap():
    """
    Complete offline cache for frontend - matches offline cache shapes.
    Returns all user data needed for offline viewing and persistence.
    """
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    # Fetch all user data (exclude soft-deleted items)
    trips = Trip.query.filter_by(user_id=user_id, is_deleted=False).all()
    posts = Post.query.filter_by(user_id=user_id, is_deleted=False).all()
    saved_destinations = SavedDestination.query.filter_by(user_id=user_id, is_deleted=False).all()

    return jsonify({
        'user_id': user_id,
        'trips': [trip.to_dict(include_stops=True) for trip in trips],
        'posts': [post.to_dict() for post in posts],
        'saved_destinations': [dest.to_dict() for dest in saved_destinations]
    })


# ============================================================================
# POSTS ENDPOINTS
# ============================================================================

@api.route('/posts', methods=['GET'])
def get_posts():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    posts = Post.query.filter_by(user_id=user_id, is_deleted=False).all()
    return jsonify([post.to_dict() for post in posts])


@api.route('/posts', methods=['POST'])
def create_post():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json() or {}

    if not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400

    post = Post(
        user_id=user_id,
        title=data['title'],
        content=data['content']
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post.to_dict()), 201


# ============================================================================
# TRIPS ENDPOINTS
# ============================================================================

@api.route('/trips', methods=['GET'])
def get_trips():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    trips = Trip.query.filter_by(user_id=user_id, is_deleted=False).all()
    # Return trips without stops (use specific endpoint for that)
    return jsonify([trip.to_dict(include_stops=False) for trip in trips])


@api.route('/trips/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    trip = Trip.query.filter_by(id=trip_id, user_id=user_id, is_deleted=False).first_or_404()
    # Always include stops for single trip endpoint
    return jsonify(trip.to_dict(include_stops=True))


@api.route('/trips', methods=['POST'])
def create_trip():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json() or {}

    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    trip = Trip(
        user_id=user_id,
        name=data['name'],
        description=data.get('description')
    )
    db.session.add(trip)
    db.session.commit()

    # Return new trip without stops
    return jsonify(trip.to_dict(include_stops=False)), 201


# ============================================================================
# TRIP STOPS ENDPOINTS - Itinerary items
# ============================================================================

@api.route('/trips/<int:trip_id>/stops', methods=['POST'])
def create_trip_stop(trip_id):
    """
    Add a stop (itinerary item) to a trip.
    Increments parent trip version for offline sync conflict resolution.
    """
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    trip = Trip.query.filter_by(id=trip_id, user_id=user_id, is_deleted=False).first_or_404()
    data = request.get_json() or {}

    if not data.get('location'):
        return jsonify({'error': 'Location is required'}), 400

    stop = TripStop(
        trip_id=trip.id,
        location=data['location'],
        description=data.get('description'),
        order=data.get('order', 0)
    )

    db.session.add(stop)
    trip.version += 1  # Increment for offline sync
    db.session.commit()

    # Return updated trip with all stops for offline cache
    return jsonify(trip.to_dict(include_stops=True)), 201


# ============================================================================
# SAVED DESTINATIONS ENDPOINTS
# ============================================================================

@api.route('/saved-destinations', methods=['GET'])
def get_saved_destinations():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    destinations = SavedDestination.query.filter_by(user_id=user_id, is_deleted=False).all()
    return jsonify([dest.to_dict() for dest in destinations])


@api.route('/saved-destinations', methods=['POST'])
def create_saved_destination():
    user_id, auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json() or {}

    if not data.get('destination'):
        return jsonify({'error': 'Destination is required'}), 400

    saved_destination = SavedDestination(
        user_id=user_id,
        destination=data['destination']
    )

    db.session.add(saved_destination)
    db.session.commit()

    return jsonify(saved_destination.to_dict()), 201

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = db.Column(db.Integer, default=1, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'version': self.version
        }


class User(BaseModel):
    __tablename__ = 'users'

    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        data = super().to_dict()
        data.update({
            'username': self.username,
            'email': self.email
        })
        return data


class Post(BaseModel):
    __tablename__ = 'posts'

    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

    def to_dict(self):
        data = super().to_dict()
        data.update({
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content
        })
        return data


class Trip(BaseModel):
    __tablename__ = 'trips'

    user_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    stops = db.relationship(
        'TripStop',
        backref='trip',
        lazy='joined',
        cascade='all, delete-orphan',
        order_by='TripStop.order'
    )

    def to_dict(self, include_stops=False):
        data = super().to_dict()
        data.update({
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description
        })
        # Always include stops for offline-first syncing to frontend
        if include_stops:
            data['stops'] = [stop.to_dict() for stop in self.stops if not stop.is_deleted]
        return data


class TripStop(BaseModel):
    __tablename__ = 'trip_stops'

    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0, nullable=False)

    def to_dict(self):
        data = super().to_dict()
        data.update({
            'trip_id': self.trip_id,
            'location': self.location,
            'description': self.description,
            'order': self.order
        })
        return data


class SavedDestination(BaseModel):
    __tablename__ = 'saved_destinations'

    user_id = db.Column(db.Integer, nullable=False)
    destination = db.Column(db.String(200), nullable=False)

    def to_dict(self):
        data = super().to_dict()
        data.update({
            'user_id': self.user_id,
            'destination': self.destination
        })
        return data

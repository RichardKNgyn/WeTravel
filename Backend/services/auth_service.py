# auth_service.py
import bcrypt   
from models import User
from database import db 

class AuthService:

    @staticmethod
    def create_user(username, password):
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        user = User(username=username, password_hash=hashed.decode())
        db.session.add(user)
        db.session.commit()
        return user


    @staticmethod
    def validate_user(username, password):
        user = User.query.filter_by(username=username).first()
        if not user:
            return False

        return bcrypt.checkpw(password.encode(), user.password_hash.encode())

# auth_service.py
import bcrypt   
from models import User
from database import db 

# services/auth_service.py

class AuthService:

    @staticmethod
    def validate_user(email, password):
        # Look up user by email
        user = User.query.filter_by(email=email).first()

        if not user:
            return None  # Email not found

        # Compare password with hashed password
        if not bcrypt.checkpw(password.encode(), user.password.encode()):
            return None  # Wrong password

        return user  # Login success
    

    @staticmethod
    def create_user(first_name, last_name, username, email, password):
        # Hash password
        hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        # Create user object
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            username=username,
            email=email,
            password=hashed_pw
        )

        # Save to database
        db.session.add(new_user)
        db.session.commit()

        return new_user


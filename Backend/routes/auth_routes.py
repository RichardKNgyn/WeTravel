# auth_routes.py

from flask import Blueprint, request, jsonify 
from services.auth_service import AuthService

auth = Blueprint("auth", __name__)

@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    user = AuthService.create_user(username, password)
    return jsonify({"message": "User created", "id": user.id}), 201


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if AuthService.validate_user(username, password):
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid credentials"}), 401

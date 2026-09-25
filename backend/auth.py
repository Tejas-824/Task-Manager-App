import jwt
from functools import wraps
from flask import request, jsonify
from config import Config

def get_user_from_token(token):
    """
    When someone logs in via Google on the frontend, Supabase gives them
    a JWT (a signed token proving who they are). The frontend sends that
    token to our backend on every request in the Authorization header.
    Here we decode it and check the signature is valid using our
    Supabase JWT secret. If it's valid, we trust the user id inside it.
    """
    try:
        payload = jwt.decode(
            token,
            Config.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload  # contains 'sub' (user id) and 'email'
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login_required(f):
    """
    This is a decorator. We put @login_required above any route that
    should only work for logged-in users. It checks the Authorization
    header, verifies the token, and if valid, passes the user info
    into the route function as 'current_user'.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ")[1]
        user = get_user_from_token(token)

        if user is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(current_user=user, *args, **kwargs)
    return decorated
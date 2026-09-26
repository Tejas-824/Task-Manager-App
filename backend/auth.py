from functools import wraps
from flask import request, jsonify
from supabase import create_client
from config import Config

# separate client just for verifying tokens
_verify_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)

def get_user_from_token(token):
    """
    Instead of manually decoding the JWT ourselves, we ask Supabase directly
    'hey, is this token valid, and who does it belong to?'
    This avoids any mismatch issues with signing key types (HS256 vs ECC).
    """
    try:
        response = _verify_client.auth.get_user(token)
        if response and response.user:
            return {"sub": response.user.id, "email": response.user.email}
        return None
    except Exception as e:
        print(f"Token verification failed: {e}")
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
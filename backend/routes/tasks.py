from flask import Blueprint, request, jsonify
from supabase import create_client
from config import Config
from auth import login_required
from email_utils import send_email

tasks_bp = Blueprint("tasks", __name__)

supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)


@tasks_bp.route("/api/tasks", methods=["GET"])
@login_required
def get_tasks(current_user):
    user_id = current_user["sub"]

    # get tasks either created by me or assigned to me
    result = supabase.table("tasks") \
        .select("*") \
        .or_(f"created_by.eq.{user_id},assigned_to.eq.{user_id}") \
        .order("created_at", desc=True) \
        .execute()

    return jsonify(result.data), 200


@tasks_bp.route("/api/tasks", methods=["POST"])
@login_required
def create_task(current_user):
    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")
    assigned_to = data.get("assigned_to")  # user id of the person we're assigning to

    if not title:
        return jsonify({"error": "Title is required"}), 400

    new_task = {
        "title": title,
        "description": description,
        "created_by": current_user["sub"],
        "assigned_to": assigned_to,
        "status": "pending"
    }

    result = supabase.table("tasks").insert(new_task).execute()
    created_task = result.data[0]

    # if it was assigned to someone, email them
    if assigned_to:
        assignee = supabase.table("profiles").select("email").eq("id", assigned_to).single().execute()
        if assignee.data:
            send_email(
                to_email=assignee.data["email"],
                subject=f"New task assigned to you: {title}",
                body_text=f"You have been assigned a new task:\n\n{title}\n{description}"
            )

    return jsonify(created_task), 201


@tasks_bp.route("/api/tasks/<task_id>/complete", methods=["PATCH"])
@login_required
def complete_task(current_user, task_id):
    # fetch the task first so we know who created it (to email them)
    task = supabase.table("tasks").select("*").eq("id", task_id).single().execute()

    if not task.data:
        return jsonify({"error": "Task not found"}), 404

    # only creator or the assignee should be able to mark it complete
    if current_user["sub"] not in [task.data["created_by"], task.data["assigned_to"]]:
        return jsonify({"error": "Not allowed"}), 403

    from datetime import datetime, timezone
    updated = supabase.table("tasks").update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", task_id).execute()

    # notify the person who created the task
    creator = supabase.table("profiles").select("email").eq("id", task.data["created_by"]).single().execute()
    if creator.data:
        send_email(
            to_email=creator.data["email"],
            subject=f"Task completed: {task.data['title']}",
            body_text=f"Your task '{task.data['title']}' has been marked as completed."
        )

    return jsonify(updated.data[0]), 200


@tasks_bp.route("/api/users", methods=["GET"])
@login_required
def get_users(current_user):
    # used to populate the "assign to" dropdown on the frontend
    result = supabase.table("profiles").select("id, email, full_name").execute()
    return jsonify(result.data), 200
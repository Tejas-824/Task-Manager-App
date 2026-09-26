"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
  assigned_to: string | null;
};

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const fetchTasks = async () => {
    const token = await getToken();
    if (!token) {
      router.push("/");
      return;
    }
    const res = await fetch(`${BACKEND_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTasks(data);
  };

  const fetchUsers = async () => {
    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    setLoading(false);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
  e.preventDefault();
  setCreating(true);
  const token = await getToken();

  await fetch(`${BACKEND_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      description,
      assigned_to: assignedTo || null,
    }),
  });

  setTitle("");
  setDescription("");
  setAssignedTo("");
  await fetchTasks();
  setCreating(false);
};

  const handleCompleteTask = async (taskId: string) => {
  setCompletingId(taskId);
  const token = await getToken();
  await fetch(`${BACKEND_URL}/api/tasks/${taskId}/complete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetchTasks();
  setCompletingId(null);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user ? (user.full_name || user.email) : "Unknown user";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "100px", color: "#666" }}>
        Loading...
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div style={{ backgroundColor: "#f5f6fa", minHeight: "100vh", padding: "30px 20px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ fontSize: "24px", color: "#1a1a1a", margin: 0 }}>My Tasks</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#444",
              fontSize: "14px",
            }}
          >
            Logout
          </button>
        </div>

        {/* Create task card */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: "28px",
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#333" }}>
            Create a new task
          </h3>
          <form onSubmit={handleCreateTask}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={inputStyle}
            >
              <option value="">Assign to (optional)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
            <button
  type="submit"
  disabled={creating}
  style={{
    padding: "10px 18px",
    backgroundColor: creating ? "#93b4f0" : "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: creating ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 600,
  }}
>
  {creating ? "Creating..." : "Create Task"}
</button>
          </form>
        </div>

        {/* Pending tasks */}
        <h4 style={{ color: "#555", fontSize: "14px", marginBottom: "10px" }}>
          Pending ({pendingTasks.length})
        </h4>
        {pendingTasks.length === 0 && (
          <p style={{ color: "#999", fontSize: "14px", marginBottom: "20px" }}>
            No pending tasks.
          </p>
        )}
        {pendingTasks.map((task) => (
          <div key={task.id} style={cardStyle}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1a1a1a" }}>
                {task.title}
              </h3>
              {task.description && (
                <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                  {task.description}
                </p>
              )}
              {getAssigneeName(task.assigned_to) && (
                <p style={{ margin: "0 0 8px 0", color: "#888", fontSize: "13px" }}>
                  Assigned to: {getAssigneeName(task.assigned_to)}
                </p>
              )}
              <span style={pendingBadge}>Pending</span>
            </div>
            <button
  onClick={() => handleCompleteTask(task.id)}
  disabled={completingId === task.id}
  style={{
    ...completeButtonStyle,
    opacity: completingId === task.id ? 0.6 : 1,
    cursor: completingId === task.id ? "not-allowed" : "pointer",
  }}
>
  {completingId === task.id ? "Updating..." : "Mark Complete"}
</button>
          </div>
        ))}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <h4 style={{ color: "#555", fontSize: "14px", margin: "24px 0 10px 0" }}>
              Completed ({completedTasks.length})
            </h4>
            {completedTasks.map((task) => (
              <div key={task.id} style={{ ...cardStyle, opacity: 0.7 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1a1a1a" }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                      {task.description}
                    </p>
                  )}
                  <span style={completedBadge}>Completed</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// shared style objects, kept outside the component so they aren't recreated every render
const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: "10px",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "16px 20px",
  borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const pendingBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#fff7e6",
  color: "#b58105",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
};

const completedBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#e6f9ec",
  color: "#1a9d4b",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
};

const completeButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  backgroundColor: "#111",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  whiteSpace: "nowrap",
};
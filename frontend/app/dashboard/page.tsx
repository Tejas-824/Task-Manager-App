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
    fetchTasks();
  };

  const handleCompleteTask = async (taskId: string) => {
    const token = await getToken();
    await fetch(`${BACKEND_URL}/api/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Tasks</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Task creation form */}
      <form onSubmit={handleCreateTask} style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px" }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px" }}
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "8px", padding: "8px" }}
        >
          <option value="">Assign to (optional)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>
        <button type="submit">Create Task</button>
      </form>

      {/* Task list */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Status: <strong>{task.status}</strong></p>
          {task.status === "pending" && (
            <button onClick={() => handleCompleteTask(task.id)}>Mark Complete</button>
          )}
        </div>
      ))}
    </div>
  );
}
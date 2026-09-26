"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f6fa",
      }}
    >
      <div
        style={{
          textAlign: "center",
          backgroundColor: "#fff",
          padding: "40px 50px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "6px", color: "#1a1a1a" }}>Task Manager</h1>
        <p style={{ color: "#777", marginBottom: "24px", fontSize: "14px" }}>
          Login to view and manage your tasks
        </p>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "10px 24px",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
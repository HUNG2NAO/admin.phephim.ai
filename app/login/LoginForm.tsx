"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          router.push(redirect);
        }
      } catch {}
    };
    checkAuth();
  }, [router, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#090e17",
      color: "#f0f4fa",
      fontFamily: 'Inter,"Segoe UI",system-ui,-apple-system,sans-serif',
      padding: "24px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#101824",
        border: "1px solid #243141",
        borderRadius: "16px",
        padding: "48px 40px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(130deg,#3be9cd,#138d91)",
            margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "28px", color: "#061e21", boxShadow: "0 12px 32px #25ceb333"
          }}>P</div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.02em" }}>
            PHE PHIM AI
          </h1>
          <p style={{ color: "#8390a3", fontSize: "14px" }}>Control Room · Đăng nhập quản trị</p>
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "14px 16px", borderRadius: "10px",
            background: "#40282e", border: "1px solid #80434a",
            color: "#ffc2c6", fontSize: "13px", marginBottom: "20px"
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c8d6df", marginBottom: "8px" }}>
              Tài khoản
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
              disabled={loading}
              style={{
                width: "100%", height: "48px", borderRadius: "10px",
                border: "1px solid #35485b", background: "#0c1521",
                color: "#f1f6fb", padding: "0 16px", fontSize: "14px",
                outline: "none", transition: "border-color 0.2s"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#c8d6df", marginBottom: "8px" }}>
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                autoComplete="current-password"
                required
                disabled={loading}
                style={{
                  width: "100%", height: "48px", borderRadius: "10px",
                  border: "1px solid #35485b", background: "#0c1521",
                  color: "#f1f6fb", padding: "0 16px", fontSize: "14px",
                  outline: "none", paddingRight: "52px"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#7e95a9", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", height: "52px", borderRadius: "10px",
              background: "linear-gradient(130deg,#48e1c8,#25b7ae)",
              color: "#042526", border: "none", fontSize: "15px",
              fontWeight: 800, letterSpacing: "0.02em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1, transition: "opacity 0.2s, filter 0.2s"
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <Lock size={20} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #243141", textAlign: "center" }}>
          <p style={{ color: "#677a8d", fontSize: "12px", margin: 0 }}>
            Bảo mật bởi PHE PHIM AI Admin System
          </p>
        </div>
      </div>
    </div>
  );
}
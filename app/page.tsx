"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { Loader2 } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        setIsAdmin(true);
      } else {
        setAdminError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      setAdminError("Không thể xác thực phiên đăng nhập.");
    } finally {
      setAuthChecked(true);
    }
  }

  if (!authChecked) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090e17",
        color: "#f0f4fa",
        fontFamily: 'Inter,"Segoe UI",system-ui,-apple-system,sans-serif'
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "linear-gradient(130deg,#3be9cd,#138d91)",
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "24px", color: "#061e21"
          }}>P</div>
          <p style={{ color: "#8390a3" }}>Đang xác thực...</p>
          <Loader2 size={24} style={{ marginTop: "16px", color: "#39d8c3", animation: "spin 0.8s linear infinite" }} />
        </div>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (adminError) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090e17",
        color: "#f0f4fa",
        fontFamily: 'Inter,"Segoe UI",system-ui,-apple-system,sans-serif',
        padding: "24px", textAlign: "center"
      }}>
        <div style={{ maxWidth: "400px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#40282e", border: "1px solid #80434a",
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e68e92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>{adminError}</h1>
          <p style={{ color: "#8390a3", marginBottom: "24px" }}>
            Vui lòng đăng nhập lại.
          </p>
          <a href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "8px",
            background: "#182330", border: "1px solid #334459",
            color: "#d2dce4", fontWeight: 600, textDecoration: "none"
          }}>
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090e17",
        color: "#f0f4fa",
        fontFamily: 'Inter,"Segoe UI",system-ui,-apple-system,sans-serif',
        padding: "24px", textAlign: "center"
      }}>
        <div style={{ maxWidth: "400px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#40282e", border: "1px solid #80434a",
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e68e92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Chưa đăng nhập</h1>
          <p style={{ color: "#8390a3", marginBottom: "24px" }}>
            Vui lòng đăng nhập để truy cập Control Room.
          </p>
          <a href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "8px",
            background: "linear-gradient(130deg,#48e1c8,#25b7ae)",
            color: "#042526", fontWeight: 800, textDecoration: "none"
          }}>
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Dashboard } from "@/components/dashboard";

export default function Page() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      checkAdminAccess();
    }
  }, [isLoaded, isSignedIn, userId]);

  async function checkAdminAccess() {
    try {
      const res = await fetch("/api/auth/check-admin", { cache: "no-store" });
      if (res.ok) {
        setIsAdmin(true);
      } else {
        setAdminError("Bạn không có quyền truy cập trang quản trị.");
      }
    } catch {
      setAdminError("Không thể xác thực quyền quản trị.");
    } finally {
      setAdminChecked(true);
    }
  }

  if (!isLoaded) {
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
          <p style={{ color: "#8390a3" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (!adminChecked) {
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
          <p style={{ color: "#8390a3" }}>Đang xác thực quyền quản trị...</p>
        </div>
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
            Chỉ tài khoản được cấp quyền mới có thể truy cập Control Room.
          </p>
          <a href="/sign-in?signOut=true" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "8px",
            background: "#182330", border: "1px solid #334459",
            color: "#d2dce4", fontWeight: 600, textDecoration: "none"
          }}>
            Đăng xuất và thử tài khoản khác
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
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Không có quyền truy cập</h1>
          <p style={{ color: "#8390a3", marginBottom: "24px" }}>
            Tài khoản của bạn chưa được cấp quyền quản trị.
          </p>
          <a href="/sign-in?signOut=true" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "8px",
            background: "#182330", border: "1px solid #334459",
            color: "#d2dce4", fontWeight: 600, textDecoration: "none"
          }}>
            Đăng xuất và thử tài khoản khác
          </a>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
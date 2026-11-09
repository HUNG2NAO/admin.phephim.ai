"use client";

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#090e17" }}><p style={{ color: "#8390a3" }}>Đang tải...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
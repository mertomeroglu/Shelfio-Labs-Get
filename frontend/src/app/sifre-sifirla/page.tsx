"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "Şifre sıfırlama bağlantısı eksik.");
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password);
  const hasNumber = /\d/.test(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Şifre sıfırlama bağlantısı eksik.");
      return;
    }

    if (!password) {
      setError("Yeni şifre girin.");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermelidir.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setMessage("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-simple-page">
      <Container className="auth-simple-layout">
        <Card className="auth-simple-card" padding="lg" variant="elevated">
          <p className="eyebrow">Şifre işlemleri</p>
          <h1>Yeni Şifre Belirle</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Yeni şifre</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>

            <div className="password-rules" style={{ marginTop: "-6px", marginBottom: "8px", fontSize: "0.82rem", display: "grid", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasMinLength ? "var(--color-success)" : "var(--color-text-muted)", transition: "color 150ms ease" }}>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{hasMinLength ? "✓" : "•"}</span> En az 8 karakter
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasLetter ? "var(--color-success)" : "var(--color-text-muted)", transition: "color 150ms ease" }}>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{hasLetter ? "✓" : "•"}</span> En az 1 harf
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasNumber ? "var(--color-success)" : "var(--color-text-muted)", transition: "color 150ms ease" }}>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{hasNumber ? "✓" : "•"}</span> En az 1 rakam
              </div>
            </div>

            <label className="form-field">
              <span>Şifre tekrar</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>

            {message ? <p className="form-success">{message}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <Button disabled={submitting || !token || !password || !confirmPassword} type="submit">
              {submitting ? "Güncelleniyor" : "Şifreyi Güncelle"}
            </Button>
          </form>
        </Card>
      </Container>
    </section>
  );
}

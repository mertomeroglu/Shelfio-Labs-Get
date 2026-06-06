"use client";

import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/services/authService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await requestPasswordReset(email);
    } finally {
      setMessage("Eğer e-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilmiştir.");
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-simple-page">
      <Container className="auth-simple-layout">
        <Card className="auth-simple-card" padding="lg" variant="elevated">
          <p className="eyebrow">Şifre işlemleri</p>
          <h1>Şifremi Unuttum</h1>
          <p>Hesabınıza ait e-posta adresini girin; kayıtlıysa sıfırlama bağlantısı gönderilir.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>E-posta</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {message ? <p className="form-success">{message}</p> : null}
            <Button disabled={submitting} type="submit">{submitting ? "Gönderiliyor" : "Bağlantı Gönder"}</Button>
          </form>
        </Card>
      </Container>
    </section>
  );
}

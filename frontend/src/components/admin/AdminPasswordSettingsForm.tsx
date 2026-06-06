"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AdminPasswordSettingsForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    repeatPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.currentPassword || !form.newPassword || !form.repeatPassword) {
      setError("Tüm şifre alanlarını doldurun.");
      return;
    }

    if (form.newPassword !== form.repeatPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    setMessage("Şifre değişikliği isteği doğrulandı.");
  }

  return (
    <Card className="admin-settings-card admin-password-card">
      <div className="admin-section-heading">
        <span>Güvenlik</span>
        <h2>Şifre Değiştir</h2>
      </div>
      <form className="admin-password-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Mevcut şifre</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            type="password"
            value={form.currentPassword}
          />
        </label>
        <label className="form-field">
          <span>Yeni şifre</span>
          <input
            autoComplete="new-password"
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            type="password"
            value={form.newPassword}
          />
        </label>
        <label className="form-field">
          <span>Yeni şifre tekrar</span>
          <input
            autoComplete="new-password"
            onChange={(event) => setForm({ ...form, repeatPassword: event.target.value })}
            type="password"
            value={form.repeatPassword}
          />
        </label>
        {error ? <p className="form-alert" role="alert">{error}</p> : null}
        {message ? <p className="form-alert form-alert--success" role="status">{message}</p> : null}
        <Button type="submit">Kaydet</Button>
      </form>
    </Card>
  );
}

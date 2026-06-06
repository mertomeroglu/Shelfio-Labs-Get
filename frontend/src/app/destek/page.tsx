"use client";

import { FormEvent, useState } from "react";
import { submitPublicSupportRequest } from "@/services/accountService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function PublicSupportPage() {
  const [form, setForm] = useState({ customerEmail: "", customerName: "", message: "", subject: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.customerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail) || !form.subject.trim() || form.message.trim().length < 10) {
      setError("Lütfen ad soyad, geçerli e-posta, konu ve en az 10 karakterlik mesaj girin.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicSupportRequest({
        customerEmail: form.customerEmail.trim(),
        customerName: form.customerName.trim(),
        message: form.message.trim(),
        subject: form.subject.trim(),
      });
      setSuccess("Destek talebiniz alındı. Ekibimiz e-posta adresiniz üzerinden dönüş yapacaktır.");
      setForm({ customerEmail: "", customerName: "", message: "", subject: "" });
    } catch {
      setError("Destek talebiniz şu anda alınamadı. Lütfen bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="public-support-page">
      <Container className="public-support-layout">
        <div className="public-support-copy">
          <p className="eyebrow">Destek</p>
          <h1>Destek talebinizi bize iletin.</h1>
          <p>Destek talebinizi güvenli şekilde kaydediyoruz. Ekibimiz başvurunuzu inceleyerek e-posta adresiniz üzerinden dönüş yapacaktır.</p>
        </div>
        <Card className="public-support-card" padding="lg">
          <form className="support-request-form" onSubmit={handleSubmit}>
            <label className="form-field"><span>Ad soyad</span><input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
            <label className="form-field"><span>E-posta</span><input type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} /></label>
            <label className="form-field"><span>Konu</span><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
            <label className="form-field"><span>Mesaj</span><textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
            {error ? <p className="form-error">{error}</p> : null}
            {success ? <p className="form-success">{success}</p> : null}
            <Button disabled={submitting} type="submit">{submitting ? "Gönderiliyor" : "Destek talebi gönder"}</Button>
          </form>
        </Card>
      </Container>
    </section>
  );
}




import nodemailer from "nodemailer";

export type DemoRequestMailPayload = {
  businessName: string;
  businessType?: string;
  email: string;
  fullName: string;
  interestedModules: string[];
  message?: string;
  phone?: string;
  source: string;
  storeCount: number;
  submittedAt: string;
};

export type PasswordResetMailPayload = {
  email: string;
  resetUrl: string;
};

export type LicenseCreatedMailPayload = {
  customerEmail: string;
  expiresAt?: string | null;
  licenseKey?: string | null;
  licenseType: string;
  maskedKey?: string | null;
  planName: string;
  resetUrl?: string | null;
  isNewCustomer?: boolean | null;
  referenceId?: string | null;
  statusLabel?: string | null;
};

export type SupportRequestMailPayload = {
  customerEmail: string;
  customerName: string;
  message: string;
  source: string;
  subject: string;
  submittedAt: string;
};

export type DemoRejectedMailPayload = {
  customerEmail: string;
  customerName: string;
  reason?: string | null;
};

export type PlanUpgradeMailPayload = {
  currentPlanName: string;
  customerEmail: string;
  newPlanName: string;
  startsAt: string;
};

export type DataExportReadyMailPayload = {
  customerEmail: string;
  customerName?: string | null;
  downloadUrl: string;
  expiresAt: string;
  storeName: string;
};

export type DataExportRejectedMailPayload = {
  customerEmail: string;
  customerName: string;
  storeName: string;
  reason?: string | null;
};

type MailConfig = {
  cc?: string;
  enabled: boolean;
  from: string;
  host?: string;
  pass?: string;
  port: number;
  secure: boolean;
  to?: string;
  user?: string;
};

const publicSiteUrl = (process.env.PUBLIC_SITE_URL || "https://getshelfio.com").replace(/\/$/, "");
const publicSupportEmail = "info@getshelfio.com";
const mailLogoUrl = `${publicSiteUrl}/assets/brand/get-shelfio-wordmark.png`;

export function isEmailConfigured() {
  const config = getMailConfig();
  return Boolean(config.enabled && config.host && config.user && config.pass);
}

export async function sendDemoRequestMail(payload: DemoRequestMailPayload) {
  const config = getMailConfig();
  if (!config.enabled) throw new Error("email_disabled");
  if (!config.host || !config.user || !config.pass || !config.to) throw new Error("email_not_configured");

  const transporter = createTransport(config);
  await transporter.sendMail({
    cc: config.cc || undefined,
    from: config.from,
    html: createDemoRequestHtml(payload),
    subject: `Yeni Shelfio Demo Talebi - ${sanitizeHeaderValue(payload.businessName)}`,
    text: createDemoRequestText(payload),
    to: config.to,
  });
}

export async function sendDemoRequestReceiptMail(payload: DemoRequestMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html: createDemoRequestReceiptHtml(payload),
    subject: "Shelfio demo talebiniz alındı",
    text: [
      "Shelfio demo talebiniz alındı.",
      "Ekibimiz uygunluk durumuna göre sizinle iletişime geçecek.",
      "Demo kullanım süresi 1 haftadır.",
      "Bu e-posta bilgilendirme amaçlıdır.",
    ].join("\n"),
    to: payload.email,
  });
}

export async function sendLicenseCreatedMail(payload: LicenseCreatedMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const isDemo = payload.licenseType === "demo";
  const transporter = createTransport(config);
  const systemUrl = payload.resetUrl || "https://getshelfio.com/giris?next=/hesap/lisanslar";
  const statusLabel = payload.statusLabel || (isDemo ? "Demo erişimi hazır" : "Aktif");

  const textContent = payload.isNewCustomer
    ? [
        "Shelfio lisansınız oluşturuldu.",
        "Hesabınız oluşturuldu. Güvenli bağlantı üzerinden yeni şifrenizi belirleyerek müşteri portalına giriş yapabilirsiniz.",
        `Müşteri E-postası: ${payload.customerEmail}`,
        `Plan: ${payload.planName}`,
        `Lisans anahtarı: ${payload.licenseKey || "-"}`,
        `Şifre oluşturma bağlantısı: ${systemUrl}`,
        `Portal giriş bağlantısı: https://getshelfio.com/giris`,
      ].join("\n")
    : [
        "Shelfio lisansınız oluşturuldu.",
        "Lisansınız hesabınıza eklendi.",
        `Müşteri E-postası: ${payload.customerEmail}`,
        `Plan: ${payload.planName}`,
        `Lisans anahtarı: ${payload.licenseKey || "-"}`,
        `Portal giriş bağlantısı: https://getshelfio.com/giris`,
      ].join("\n");

  await transporter.sendMail({
    from: config.from,
    html: createLicenseCreatedHtml(payload),
    subject: "Shelfio lisansınız oluşturuldu",
    text: textContent,
    to: payload.customerEmail,
  });
}

export async function sendDemoRejectedMail(payload: DemoRejectedMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html: createDemoRejectedHtml(payload),
    subject: "Demo talebiniz değerlendirildi",
    text: [
      "GetShelfio demo talebiniz değerlendirildi.",
      payload.reason ? `Değerlendirme notu: ${payload.reason}` : "Şu aşamada demo erişimi oluşturulmadı.",
      `Sorularınız için ${publicSupportEmail} adresinden bize ulaşabilirsiniz.`,
    ].join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendPlanUpgradeMail(payload: PlanUpgradeMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html: createPlanUpgradeHtml(payload),
    subject: "Shelfio plan düzenleme talebiniz alındı",
    text: [
      "Plan düzenleme talebiniz alındı.",
      `Mevcut plan: ${payload.currentPlanName}`,
      `Yeni plan: ${payload.newPlanName}`,
      `Yürürlük tarihi: ${payload.startsAt}`,
      "Müşteri paneli: https://getshelfio.com/giris?next=/hesap/lisanslar",
    ].join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendDataExportReadyMail(payload: DataExportReadyMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  const html = createBrandedMailLayout({
    heading: "Mağaza veri dosyanız hazır",
    intro: `Sayın ${payload.customerName || "Kullanıcı"}, ${payload.storeName} mağazası için talep ettiğiniz veri dosyası hazırlandı.`,
    preheader: "Mağaza veri dosyanız hazır.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Mağaza Adı", payload.storeName)}
        ${createInfoRow("Link Geçerlilik Süresi", payload.expiresAt)}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px">Bu link size özeldir, paylaşmayın.</p>
      ${createButton(payload.downloadUrl, "Excel Dosyasını İndir")}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px">
            <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:8px">Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</div>
            <a href="${escapeHtml(payload.downloadUrl)}" style="color:#2563eb;font-size:13px;line-height:1.6;word-break:break-all">${escapeHtml(payload.downloadUrl)}</a>
          </td>
        </tr>
      </table>
    `,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Mağaza veri dosyanız hazır - ${sanitizeHeaderValue(payload.storeName)}`,
    text: [
      "Mağaza veri dosyanız hazır.",
      `Mağaza: ${payload.storeName}`,
      `Link: ${payload.downloadUrl}`,
      `Geçerlilik: ${payload.expiresAt}`,
      "Bu link size özeldir, paylaşmayın.",
    ].join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendDataExportRejectedMail(payload: DataExportRejectedMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  const html = createBrandedMailLayout({
    heading: "Mağaza Verisi Talebi Reddedildi",
    intro: `Sayın ${payload.customerName || "Kullanıcı"}, ${payload.storeName} mağazası için yaptığınız veri talebi (dışa aktarım) reddedilmiştir.`,
    preheader: "Mağaza verisi talebiniz reddedildi.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Mağaza Adı", payload.storeName)}
        ${createInfoRow("Durum", "Reddedildi")}
        ${payload.reason ? createInfoRow("Red Nedeni", payload.reason) : ""}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px">Detaylı bilgi için destek ekibimizle iletişime geçebilirsiniz.</p>
    `,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Mağaza Verisi Talebi Reddedildi - ${sanitizeHeaderValue(payload.storeName)}`,
    text: [
      "Mağaza Verisi Talebi Reddedildi",
      `Sayın ${payload.customerName},`,
      `${payload.storeName} mağazanız için yaptığınız veri talebi reddedilmiştir.`,
      payload.reason ? `Red Nedeni: ${payload.reason}` : "",
    ].filter(Boolean).join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendPasswordResetMail(payload: PasswordResetMailPayload) {
  const config = getMailConfig();
  if (!config.enabled) throw new Error("email_disabled");
  if (!config.host || !config.user || !config.pass) throw new Error("email_not_configured");

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: process.env.PASSWORD_RESET_FROM || config.from,
    html: createPasswordResetHtml(payload),
    subject: "Şifrenizi sıfırlayın - Shelfio",
    text: [
      "Şifrenizi sıfırlayın",
      "Shelfio hesabınız için şifre sıfırlama talebi aldık.",
      payload.resetUrl,
      "Bu bağlantı belirli süre için geçerlidir. Bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.",
    ].join("\n"),
    to: payload.email,
  });
}

export async function sendSupportRequestMail(payload: SupportRequestMailPayload) {
  const config = getMailConfig();
  const to = process.env.SUPPORT_TO || config.to;
  if (!config.enabled) throw new Error("email_disabled");
  if (!config.host || !config.user || !config.pass || !to) throw new Error("email_not_configured");

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html: createSupportRequestHtml(payload),
    replyTo: payload.customerEmail,
    subject: `Yeni Shelfio Destek Talebi - ${sanitizeHeaderValue(payload.subject)}`,
    text: createSupportRequestText(payload),
    to,
  });
}

export type SupportRequestReceiptMailPayload = {
  customerEmail: string;
  customerName: string;
  ticketId: string;
  subject: string;
  message: string;
  submittedAt: string;
};

export async function sendSupportRequestReceiptMail(payload: SupportRequestReceiptMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const trackingNumber = generateTrackingNumber(payload.ticketId, payload.submittedAt);
  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html: createSupportRequestReceiptHtml(payload, trackingNumber),
    subject: `Destek talebiniz alındı - ${trackingNumber}`,
    text: [
      "Destek talebiniz alındı.",
      `Takip numarası: ${trackingNumber}`,
      `Konu: ${payload.subject}`,
      `Tarih: ${payload.submittedAt}`,
      "Talebiniz ekibimize iletilmiştir. Dönüşlerimiz bu e-posta adresi üzerinden yapılacaktır.",
    ].join("\n"),
    to: payload.customerEmail,
  });
}

export type AdminReplyMailPayload = {
  customerEmail: string;
  customerName: string;
  ticketId: string;
  subject: string;
  replySummary: string;
  replyUrl: string;
  updatedAt: string;
};

export async function sendAdminReplyMail(payload: AdminReplyMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const trackingNumber = generateTrackingNumber(payload.ticketId, payload.updatedAt);
  const html = createBrandedMailLayout({
    heading: "Destek talebiniz yanıtlandı",
    intro: `Sayın ${payload.customerName || "Kullanıcı"}, destek talebinize ekibimiz tarafından yeni bir yanıt verilmiştir. Aşağıdaki butondan veya bağlantıdan doğrudan yanıt verebilirsiniz.`,
    preheader: `Destek talebiniz yanıtlandı: ${trackingNumber}`,
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Takip Numarası", trackingNumber)}
        ${createInfoRow("Talep Konusu", payload.subject)}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;padding:18px 18px 20px">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Admin Yanıtı</div>
            <div style="color:#0f172a;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(payload.replySummary)}</div>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 12px">
        <tr>
          <td align="center">
            <a href="${escapeHtml(payload.replyUrl)}" style="background:#2563eb;border-radius:999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:800;line-height:1;padding:16px 26px;text-decoration:none">Yanıtı Görüntüle / Cevap Ver</a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px">
            <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:8px">Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</div>
            <a href="${escapeHtml(payload.replyUrl)}" style="color:#2563eb;font-size:13px;line-height:1.6;word-break:break-all">${escapeHtml(payload.replyUrl)}</a>
          </td>
        </tr>
      </table>
    `,
  });

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Destek talebiniz yanıtlandı - ${trackingNumber}`,
    text: [
      "Destek talebiniz yanıtlandı.",
      `Takip numarası: ${trackingNumber}`,
      `Konu: ${payload.subject}`,
      "",
      `Yanıt Özeti:`,
      payload.replySummary,
      "",
      "Giriş yapmadan yanıtı görüntülemek ve cevap vermek için aşağıdaki bağlantıyı kullanabilirsiniz:",
      payload.replyUrl
    ].join("\n"),
    to: payload.customerEmail,
  });
}

function generateTrackingNumber(ticketId: string, submittedAt: string) {
  const dateStr = submittedAt.split("T")[0].replace(/-/g, "");
  const shortId = (ticketId.split("-")[0] || ticketId.slice(0, 8)).toUpperCase();
  return `DST-${dateStr}-${shortId.slice(0, 4)}`;
}

function createSupportRequestReceiptHtml(payload: SupportRequestReceiptMailPayload, trackingNumber: string) {
  return createBrandedMailLayout({
    heading: "Destek talebiniz alındı",
    intro: `Sayın ${payload.customerName}, destek talebiniz başarıyla kaydedilmiştir. Ekibimiz en kısa sürede sizinle bu e-posta adresi üzerinden iletişime geçecektir.`,
    preheader: "Destek talebiniz alındı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Takip Numarası", trackingNumber)}
        ${createInfoRow("Konu", payload.subject)}
        ${createInfoRow("Oluşturulma Tarihi", payload.submittedAt)}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;padding:18px 18px 20px">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Talep Özetiniz</div>
            <div style="color:#0f172a;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(payload.message)}</div>
          </td>
        </tr>
      </table>
    `,
  });
}

function createTransport(config: MailConfig) {
  return nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.secure,
  });
}

function assertTransactionalMailConfig(config: MailConfig) {
  if (!config.enabled) throw new Error("email_disabled");
  if (!config.host || !config.user || !config.pass) throw new Error("email_not_configured");
}

function getMailConfig(): MailConfig {
  return {
    cc: process.env.DEMO_REQUEST_CC,
    enabled: process.env.EMAIL_SEND_ENABLED !== "false",
    from: process.env.SMTP_FROM || "Shelfio <info@getshelfio.com>",
    host: process.env.SMTP_HOST,
    pass: process.env.SMTP_PASS,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    to: process.env.DEMO_REQUEST_TO || publicSupportEmail,
    user: process.env.SMTP_USER,
  };
}

function createSupportRequestText(payload: SupportRequestMailPayload) {
  return [
    "Yeni Shelfio Destek Talebi",
    `Ad soyad: ${payload.customerName}`,
    `E-posta: ${payload.customerEmail}`,
    `Konu: ${payload.subject}`,
    `Mesaj: ${payload.message}`,
    `Talep tarihi: ${payload.submittedAt}`,
    `Kaynak: ${payload.source}`,
  ].join("\n");
}

function createSupportRequestHtml(payload: SupportRequestMailPayload) {
  const rows = [
    ["Ad soyad", payload.customerName],
    ["E-posta", payload.customerEmail],
    ["Konu", payload.subject],
    ["Talep tarihi", payload.submittedAt],
    ["Kaynak", payload.source],
  ] as const;

  return createBrandedMailLayout({
    heading: "Yeni Shelfio Destek Talebi",
    intro: "Shelfio hizmet sitesi üzerinden yeni bir destek talebi oluşturuldu.",
    preheader: "Shelfio hizmet sitesi üzerinden yeni bir destek talebi oluşturuldu.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${rows.map(([label, value]) => createInfoRow(label, value)).join("")}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;padding:18px 18px 20px">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Mesaj</div>
            <div style="color:#0f172a;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(payload.message)}</div>
          </td>
        </tr>
      </table>
    `,
  });
}

function createDemoRequestText(payload: DemoRequestMailPayload) {
  return [
    "Yeni Shelfio Demo Talebi",
    `Ad soyad: ${payload.fullName}`,
    `E-posta: ${payload.email}`,
    `Telefon: ${payload.phone || "-"}`,
    `İşletme adı: ${payload.businessName}`,
    `Mağaza sayısı: ${payload.storeCount}`,
    `İşletme tipi: ${payload.businessType || "-"}`,
    `Mesaj: ${payload.message || "-"}`,
    `Talep tarihi: ${payload.submittedAt}`,
    `Kaynak: ${payload.source}`,
  ].join("\n");
}

function createDemoRequestHtml(payload: DemoRequestMailPayload) {
  const rows = [
    ["Ad soyad", payload.fullName],
    ["E-posta", payload.email],
    ["Telefon", payload.phone || "-"],
    ["İşletme adı", payload.businessName],
    ["Mağaza sayısı", String(payload.storeCount)],
    ["İşletme tipi", payload.businessType || "-"],
    ["Talep tarihi", payload.submittedAt],
    ["Kaynak", payload.source],
  ] as const;

  return createBrandedMailLayout({
    heading: "Yeni Shelfio Demo Talebi",
    intro: "Shelfio hizmet sitesi üzerinden yeni bir demo talebi oluşturuldu.",
    preheader: "Shelfio hizmet sitesi üzerinden yeni bir demo talebi oluşturuldu.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${rows.map(([label, value]) => createInfoRow(label, value)).join("")}
      </table>
      ${payload.message ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;padding:18px 18px 20px">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Mesaj</div>
            <div style="color:#0f172a;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(payload.message)}</div>
          </td>
        </tr>
      </table>
      ` : ""}
    `,
  });
}

function createDemoRequestReceiptHtml(payload: DemoRequestMailPayload) {
  return createBrandedMailLayout({
    heading: "Demo talebiniz alındı",
    intro: `${payload.fullName}, Shelfio demo talebinizi aldık. Ekibimiz uygunluk durumuna göre sizinle iletişime geçecek.`,
    preheader: "Shelfio demo talebiniz alındı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Demo kullanım süresi", "1 hafta")}
        ${createInfoRow("Bilgilendirme", "Bu e-posta bilgilendirme amaçlıdır.")}
      </table>
    `,
  });
}

function createLicenseCreatedHtml(payload: LicenseCreatedMailPayload) {
  const isDemo = payload.licenseType === "demo";
  const systemUrl = payload.resetUrl || "https://getshelfio.com/giris?next=/hesap/lisanslar";
  const statusLabel = payload.statusLabel || (isDemo ? "Demo erişimi hazır" : "Aktif");

  let headingText = "Shelfio Lisansınız Oluşturuldu";
  let introText = "";
  let buttonText = "Müşteri Portalına Git";

  if (payload.isNewCustomer) {
    introText = "Hesabınız oluşturuldu. Güvenli bağlantı üzerinden yeni şifrenizi belirleyerek müşteri portalına giriş yapabilirsiniz.";
    buttonText = "Şifre Oluştur & Giriş Yap";
  } else {
    introText = "Lisansınız hesabınıza eklendi. Müşteri portalına giriş yaparak lisansınızı kullanmaya başlayabilirsiniz.";
  }

  const rows = [
    createInfoRow("Müşteri E-postası", payload.customerEmail),
    payload.referenceId ? createInfoRow("Referans", payload.referenceId) : "",
    createInfoRow("Plan", payload.planName),
    createInfoRow("Lisans durumu", statusLabel),
    createInfoRow("Lisans tipi", licenseTypeLabel(payload.licenseType)),
    isDemo ? createInfoRow("Demo kullanım süresi", "1 hafta") : "",
    payload.expiresAt ? createInfoRow("Bitiş tarihi", payload.expiresAt) : "",
    !isDemo && payload.maskedKey ? createInfoRow("Maskeli lisans", payload.maskedKey) : "",
    payload.licenseKey ? createInfoRow("Lisans anahtarı", payload.licenseKey) : "",
  ].filter(Boolean).join("");

  return createBrandedMailLayout({
    heading: headingText,
    intro: introText,
    preheader: payload.isNewCustomer ? "Shelfio lisansınız oluşturuldu." : "Lisansınız hesabınıza eklendi.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${rows}
        ${payload.isNewCustomer ? createInfoRow("Portal Giriş Bağlantısı", "https://getshelfio.com/giris") : ""}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7">Lisans anahtarınızı güvenli biçimde saklayın. Anahtar müşteri panelinde tam haliyle gösterilmez.</p>
      ${createButton(systemUrl, buttonText)}
    `,
  });
}

function createDemoRejectedHtml(payload: DemoRejectedMailPayload) {
  return createBrandedMailLayout({
    heading: "Demo talebiniz değerlendirildi",
    intro: `${payload.customerName}, GetShelfio demo talebiniz incelendi. Şu aşamada demo erişimi oluşturulmadı.`,
    preheader: "GetShelfio demo talebiniz değerlendirildi.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Durum", "Reddedildi")}
        ${payload.reason ? createInfoRow("Not", payload.reason) : ""}
      </table>
    `,
  });
}

function createPlanUpgradeHtml(payload: PlanUpgradeMailPayload) {
  return createBrandedMailLayout({
    heading: "Plan düzenleme talebiniz alındı",
    intro: "Plan değişikliği talebiniz mevcut verileriniz korunarak bir sonraki dönem için planlandı.",
    preheader: "Shelfio plan düzenleme talebiniz alındı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Mevcut plan", payload.currentPlanName)}
        ${createInfoRow("Yeni plan", payload.newPlanName)}
        ${createInfoRow("Yürürlük tarihi", payload.startsAt)}
      </table>
      ${createButton("https://getshelfio.com/giris?next=/hesap/lisanslar", "Plan Düzenlemesini Gör")}
    `,
  });
}

function licenseTypeLabel(type: string) {
  if (type === "demo") return "Demo";
  if (type === "enterprise") return "Kurumsal / Özel";
  return "Standart";
}

function createPasswordResetHtml(payload: PasswordResetMailPayload) {
  const escapedResetUrl = escapeHtml(payload.resetUrl);

  return createBrandedMailLayout({
    heading: "Şifrenizi sıfırlayın",
    intro: "Shelfio hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.",
    preheader: "Shelfio hesabınız için şifre sıfırlama talebi aldık.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 18px">
        <tr>
          <td align="center">
            <a href="${escapedResetUrl}" style="background:#2563eb;border-radius:999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:800;line-height:1;padding:16px 26px;text-decoration:none">Şifremi Sıfırla</a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Geçerlilik", "Bu bağlantı belirli süre için geçerli olacaktır.")}
        ${createInfoRow("Güvenlik", "Eğer bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.")}
        ${createInfoRow("Yeniden talep", "Bağlantı süresi dolduğunda güvenlik amacıyla yeniden talep oluşturmanız gerekir.")}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px">
            <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:8px">Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</div>
            <a href="${escapedResetUrl}" style="color:#2563eb;font-size:13px;line-height:1.6;word-break:break-all">${escapedResetUrl}</a>
          </td>
        </tr>
      </table>
    `,
    footerNote: "Lisans, aktivasyon ve müşteri portal süreçlerinizi Shelfio üzerinden güvenle yönetin.",
  });
}

function createBrandedMailLayout({
  content,
  footerNote = "Bu e-posta Shelfio sistemleri tarafından otomatik gönderilmiştir.",
  heading,
  intro,
  preheader,
}: {
  content: string;
  footerNote?: string;
  heading: string;
  intro: string;
  preheader: string;
}) {
  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(heading)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;border-collapse:collapse">
          <tr>
            <td align="center" style="padding:28px 14px">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;max-width:640px">
                <tr>
                  <td style="background:#ffffff;border:1px solid #e2e8f0;border-bottom:0;border-radius:22px 22px 0 0;padding:22px 28px">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <img src="${escapeHtml(mailLogoUrl)}" alt="GetShelfio" width="178" style="border:0;display:block;height:auto;max-width:178px;outline:none;text-decoration:none" />
                        </td>
                        <td align="right" style="color:#2563eb;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">getshelfio.com</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;padding:30px 28px 28px">
                    <div style="background:#ecfeff;border:1px solid #cffafe;border-radius:999px;color:#0784a8;display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;padding:8px 12px;text-transform:uppercase">Shelfio hizmet bildirimi</div>
                    <h1 style="color:#0f172a;font-size:28px;line-height:1.18;margin:18px 0 10px">${escapeHtml(heading)}</h1>
                    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 22px">${escapeHtml(intro)}</p>
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fbff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 22px 22px;padding:20px 28px">
                    <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0 0 8px">${escapeHtml(footerNote)}</p>
                    <p style="color:#64748b;font-size:13px;line-height:1.65;margin:0">İletişim: <a href="mailto:${publicSupportEmail}" style="color:#2563eb;text-decoration:none">${publicSupportEmail}</a> · <a href="https://getshelfio.com/destek" style="color:#2563eb;text-decoration:none">getshelfio.com/destek</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createInfoRow(label: string, value: string, options?: { valueIsHtml?: boolean }) {
  const displayValue = options?.valueIsHtml ? value : escapeHtml(value);

  return `
    <tr>
      <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px">
        <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:5px">${escapeHtml(label)}</div>
        <div style="color:#0f172a;font-size:15px;font-weight:700;line-height:1.5">${displayValue}</div>
      </td>
    </tr>
  `;
}

function createButton(url: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 12px">
      <tr>
        <td align="center">
          <a href="${escapeHtml(url)}" style="background:#2563eb;border-radius:999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:800;line-height:1;padding:16px 26px;text-decoration:none">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

export async function sendFirstPasswordMail(payload: { email: string; businessName: string; resetUrl: string }) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const escapedResetUrl = escapeHtml(payload.resetUrl);
  const html = createBrandedMailLayout({
    heading: "Shelfio Hesabınızı Oluşturun",
    intro: `Shelfio ailesine hoş geldiniz! İşletmeniz (${payload.businessName}) için üyelik kaydınız yöneticimiz tarafından manuel olarak tanımlanmıştır. Sisteme güvenli bir şekilde erişmek için lütfen aşağıdaki butondan şifrenizi belirleyin.`,
    preheader: "Shelfio hesabınızı oluşturun ve şifrenizi belirleyin.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 18px">
        <tr>
          <td align="center">
            <a href="${escapedResetUrl}" style="background:#2563eb;border-radius:999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:800;line-height:1;padding:16px 26px;text-decoration:none">İlk Şifre Oluştur</a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Geçerlilik", "Bu bağlantı güvenlik sebebiyle 30 dakika geçerlidir.")}
        ${createInfoRow("Güvenlik", "Şifrenizi kimseyle paylaşmayın. Shelfio ekibi sizden asla şifrenizi talep etmez.")}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px">
            <div style="color:#64748b;font-size:12px;font-weight:700;margin-bottom:8px">Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</div>
            <a href="${escapedResetUrl}" style="color:#2563eb;font-size:13px;line-height:1.6;word-break:break-all">${escapedResetUrl}</a>
          </td>
        </tr>
      </table>
    `,
  });

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html,
    subject: "Shelfio hesabınızı oluşturun",
    text: [
      "Shelfio hesabınızı oluşturun",
      `İşletmeniz (${payload.businessName}) için Shelfio üyelik kaydınız tanımlanmıştır.`,
      "Aşağıdaki bağlantıyı tarayıcınıza yapıştırarak şifrenizi belirleyebilirsiniz:",
      payload.resetUrl,
      "Bu bağlantı 30 dakika geçerlidir.",
    ].join("\n"),
    to: payload.email,
  });
}

export async function sendCustomerWelcomeMail(payload: { email: string; customerName: string }) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const portalUrl = "https://getshelfio.com/giris";
  const supportUrl = "https://getshelfio.com/destek";

  const html = createBrandedMailLayout({
    heading: "Shelfio'ya Hoş Geldiniz!",
    intro: `Sayın ${payload.customerName}, Shelfio hesabınız başarıyla oluşturulmuştur. Artık mağaza operasyonlarınızı, personelinizi ve lisanslarınızı tek bir panelden yönetebilirsiniz.`,
    preheader: "Shelfio'ya hoş geldiniz! Hesabınız oluşturuldu.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Hesap Durumu", "Oluşturuldu / Aktif")}
        ${createInfoRow("Sonraki Adım", "Müşteri portalına giriş yaparak lisans anahtarınızı aktive edin.")}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:16px 0">Mağaza limiti ve diğer modüllerinizi hemen kullanmaya başlamak için aktivasyon adımını tamamlamanız gerekmektedir.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 12px">
        <tr>
          <td align="center">
            <a href="${portalUrl}" style="background:#2563eb;border-radius:999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:800;line-height:1;padding:16px 26px;text-decoration:none">Müşteri Portalına Git</a>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px;margin-top:10px">
        ${createInfoRow("Yardım ve Destek", "Bir sorunuz veya kurulum ihtiyacınız olursa bize her zaman destek sayfamızdan ulaşabilirsiniz.")}
      </table>
      <div style="text-align:center;margin-top:16px">
        <a href="${supportUrl}" style="color:#2563eb;font-size:14px;font-weight:700;text-decoration:none">Destek Talebi Oluştur →</a>
      </div>
    `,
  });

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html,
    subject: "Shelfio’ya hoş geldiniz",
    text: [
      "Shelfio’ya hoş geldiniz!",
      `Sayın ${payload.customerName}, Shelfio hesabınız başarıyla oluşturulmuştur.`,
      "Hemen müşteri portalına giderek lisans aktivasyonunuzu gerçekleştirebilirsiniz:",
      portalUrl,
      "Yardım ve destek ihtiyaçlarınız için:",
      supportUrl,
    ].join("\n"),
    to: payload.email,
  });
}

export async function sendAdminDirectMail(payload: { email: string; subject: string; message: string }) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const html = createBrandedMailLayout({
    heading: "Shelfio'dan mesajınız var",
    intro: "Destek ekibimiz veya sistem yöneticimiz tarafından size bir bilgilendirme mesajı gönderilmiştir.",
    preheader: "Shelfio'dan yeni bir mesaj aldınız.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Konu", payload.subject)}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px">
        <tr>
          <td style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;padding:18px 18px 20px">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Mesaj Detayı</div>
            <div style="color:#0f172a;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(payload.message)}</div>
          </td>
        </tr>
      </table>
    `,
  });

  const transporter = createTransport(config);
  await transporter.sendMail({
    from: config.from,
    html,
    subject: payload.subject,
    text: [
      "Shelfio'dan mesajınız var",
      `Konu: ${payload.subject}`,
      "-----------------------------------------",
      payload.message,
      "-----------------------------------------",
      "Sorularınız için getshelfio.com/destek adresini kullanabilirsiniz.",
    ].join("\n"),
    to: payload.email,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
}

export type StoreLicenseRequestApprovedMailPayload = {
  customerEmail: string;
  customerName: string;
  requestedStoreName: string;
  planName: string;
  maskedKey: string;
  licenseKey: string;
  activationUrl: string;
};

export type StoreLicenseRequestRejectedMailPayload = {
  customerEmail: string;
  customerName: string;
  requestedStoreName: string;
  reason?: string | null;
};

export type StoreLicenseRequestCreatedMailPayload = {
  customerEmail: string;
  customerName: string;
  requestedStoreName: string;
  planName: string;
  panelLink: string;
  submittedAt: string;
};

export async function sendStoreLicenseRequestApprovedMail(payload: StoreLicenseRequestApprovedMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  const html = createBrandedMailLayout({
    heading: "Mağaza Lisansı Talebiniz Onaylandı",
    intro: `Sayın ${payload.customerName || "Kullanıcı"}, ${payload.requestedStoreName} mağazanız için ek lisans talebiniz onaylanmıştır. Yeni mağazanızın lisans bilgileri aşağıdadır.`,
    preheader: "Mağaza lisansı talebiniz onaylandı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Mağaza Adı", payload.requestedStoreName)}
        ${createInfoRow("Plan", payload.planName)}
        ${createInfoRow("Lisans Durumu", "Aktivasyon Bekliyor")}
        ${createInfoRow("Maskeli Lisans", payload.maskedKey)}
        ${payload.licenseKey ? createInfoRow("Lisans Anahtarı", payload.licenseKey) : ""}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px">Lisans anahtarınızı kopyalayıp aşağıdaki linke tıklayarak hesabınızda aktive edebilirsiniz:</p>
      ${createButton(payload.activationUrl, "Lisansı Aktive Et")}
    `,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Mağaza Lisansı Talebiniz Onaylandı - ${sanitizeHeaderValue(payload.requestedStoreName)}`,
    text: [
      "Mağaza Lisansı Talebiniz Onaylandı",
      `Sayın ${payload.customerName},`,
      `${payload.requestedStoreName} mağazanız için ek lisans talebiniz onaylanmıştır.`,
      `Plan: ${payload.planName}`,
      `Maskeli Lisans: ${payload.maskedKey}`,
      payload.licenseKey ? `Lisans Anahtarı: ${payload.licenseKey}` : "",
      `Aktivasyon Linki: ${payload.activationUrl}`,
    ].filter(Boolean).join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendStoreLicenseRequestRejectedMail(payload: StoreLicenseRequestRejectedMailPayload) {
  const config = getMailConfig();
  assertTransactionalMailConfig(config);

  const transporter = createTransport(config);
  const html = createBrandedMailLayout({
    heading: "Mağaza Lisansı Talebi Sonuçlandı",
    intro: `Sayın ${payload.customerName || "Kullanıcı"}, ${payload.requestedStoreName} mağazanız için ek lisans talebiniz şu anda onaylanmadı.`,
    preheader: "Mağaza lisansı talebi sonuçlandı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Mağaza Adı", payload.requestedStoreName)}
        ${createInfoRow("Talep Durumu", "Onaylanmadı / Reddedildi")}
        ${payload.reason ? createInfoRow("Açıklama / Red Sebebi", payload.reason) : ""}
      </table>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px">Sorularınız için destek panelimiz üzerinden bizimle iletişime geçebilirsiniz.</p>
    `,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Mağaza Lisansı Talebi Sonuçlandı - ${sanitizeHeaderValue(payload.requestedStoreName)}`,
    text: [
      "Mağaza Lisansı Talebi Sonuçlandı",
      `Sayın ${payload.customerName},`,
      `${payload.requestedStoreName} mağazanız için ek lisans talebiniz şu anda onaylanmadı.`,
      payload.reason ? `Red Sebebi: ${payload.reason}` : "",
    ].filter(Boolean).join("\n"),
    to: payload.customerEmail,
  });
}

export async function sendStoreLicenseRequestCreatedMailToAdmin(payload: StoreLicenseRequestCreatedMailPayload) {
  const config = getMailConfig();
  if (!config.enabled) throw new Error("email_disabled");
  if (!config.host || !config.user || !config.pass || !config.to) throw new Error("email_not_configured");

  const transporter = createTransport(config);
  const html = createBrandedMailLayout({
    heading: "Yeni Mağaza Lisansı Talebi",
    intro: "Müşteri portalı üzerinden yeni bir mağaza lisansı talebi oluşturuldu.",
    preheader: "Yeni mağaza lisansı talebi alındı.",
    content: `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 10px">
        ${createInfoRow("Müşteri Adı", payload.customerName)}
        ${createInfoRow("Müşteri E-posta", payload.customerEmail)}
        ${createInfoRow("Talep Edilen Mağaza", payload.requestedStoreName)}
        ${createInfoRow("Plan", payload.planName)}
        ${createInfoRow("Talep Tarihi", payload.submittedAt)}
      </table>
      ${createButton(payload.panelLink, "Admin Paneline Git")}
    `,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject: `Yeni Mağaza Lisansı Talebi - ${sanitizeHeaderValue(payload.requestedStoreName)}`,
    text: [
      "Yeni Mağaza Lisansı Talebi",
      `Müşteri: ${payload.customerName} (${payload.customerEmail})`,
      `Talep Edilen Mağaza: ${payload.requestedStoreName}`,
      `Plan: ${payload.planName}`,
      `Tarih: ${payload.submittedAt}`,
      `Panel Linki: ${payload.panelLink}`,
    ].join("\n"),
    to: config.to,
  });
}

import nodemailer from "nodemailer";
import pool from "./db";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const { rows } = await pool.query(
    `SELECT key, value FROM tg_settings
     WHERE key IN ('smtp_host','smtp_port','smtp_secure','smtp_user','smtp_password','smtp_from','smtp_from_name')`
  );
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key] = r.value;

  if (!cfg.smtp_host?.trim() || !cfg.smtp_user?.trim()) return null;

  return {
    host:     cfg.smtp_host.trim(),
    port:     parseInt(cfg.smtp_port || "587", 10),
    secure:   cfg.smtp_secure === "true",
    user:     cfg.smtp_user.trim(),
    password: cfg.smtp_password ?? "",
    from:     cfg.smtp_from?.trim() || cfg.smtp_user.trim(),
    fromName: cfg.smtp_from_name?.trim() || "Topograph",
  };
}

export async function isMailConfigured(): Promise<boolean> {
  return (await getSmtpConfig()) !== null;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    console.warn("[mail] SMTP nicht konfiguriert — E-Mail nicht gesendet");
    return { sent: false, reason: "SMTP nicht konfiguriert" };
  }

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  });

  await transport.sendMail({
    from: `"${cfg.fromName}" <${cfg.from}>`,
    to,
    subject,
    html,
  });

  return { sent: true };
}

// ── E-Mail-Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string, appName = "Topograph"): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111318;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#312e81,#1e1b4b);padding:28px 32px;">
          <div style="font-size:20px;font-weight:700;color:#a5b4fc;letter-spacing:-0.5px;">${appName}</div>
          <div style="font-size:11px;color:#6366f1;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Systemdokumentation</div>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <tr><td style="border-top:1px solid #27272a;padding:16px 32px;background:#0d0f16;">
          <p style="margin:0;font-size:11px;color:#52525b;">Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetMail(
  resetUrl: string,
  expiryMinutes: number,
  appName = "Topograph"
): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#e4e4e7;">Passwort zurücksetzen</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Button, um ein neues Passwort zu vergeben.
    </p>
    <div style="margin:24px 0;">
      <a href="${resetUrl}"
         style="display:inline-block;background:#4f46e5;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.3px;">
        Passwort zurücksetzen →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
      Dieser Link ist <strong style="color:#71717a;">${expiryMinutes} Minuten</strong> gültig.<br>
      Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
    </p>
    <div style="margin-top:20px;padding:12px;background:#0a0d14;border-radius:6px;border:1px solid #27272a;">
      <p style="margin:0;font-size:11px;color:#3f3f46;">Link: <span style="color:#6366f1;word-break:break-all;">${resetUrl}</span></p>
    </div>
  `, appName);
}

export function welcomeMail(name: string | null, loginUrl: string, appName = "Topograph"): string {
  const displayName = name ?? "dort";
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#e4e4e7;">Willkommen, ${displayName}!</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Dein Konto bei <strong style="color:#e4e4e7;">${appName}</strong> wurde erfolgreich angelegt.
      Du kannst dich jetzt anmelden und Diagramme erstellen.
    </p>
    <div style="margin:24px 0;">
      <a href="${loginUrl}"
         style="display:inline-block;background:#4f46e5;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Jetzt anmelden →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#52525b;">
      Falls du kein Konto beantragt hast, wende dich bitte an den Administrator.
    </p>
  `, appName);
}

export function testMail(appName = "Topograph"): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#e4e4e7;">Test-E-Mail</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#a1a1aa;line-height:1.6;">
      Die SMTP-Konfiguration in <strong style="color:#e4e4e7;">${appName}</strong> ist korrekt eingerichtet.
      E-Mails können erfolgreich versendet werden. ✓
    </p>
    <div style="margin-top:16px;padding:12px;background:#0a0d14;border-radius:6px;border:1px solid #166534;">
      <p style="margin:0;font-size:12px;color:#22c55e;">SMTP-Verbindung erfolgreich</p>
    </div>
  `, appName);
}

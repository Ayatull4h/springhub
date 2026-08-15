import nodemailer from "nodemailer";
import logger from "./logger";
import { escapeHtml } from "./sanitize";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getTransporter() {
  const provider = process.env.EMAIL_PROVIDER || "log";

  if (provider === "smtp") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }

  return null;
}

const transporter = getTransporter();

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "log";
  const from = process.env.EMAIL_FROM || "noreply@springhub.id";

  if (!provider || provider === "log") {
    logger.info({ to: params.to, subject: params.subject }, "Email logged (dev mode)");
    return;
  }

  if (provider === "smtp" && transporter) {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    logger.info({ to: params.to, subject: params.subject }, "Email sent via SMTP");
    return;
  }

  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    logger.warn({ provider }, "No EMAIL_API_KEY configured");
    return;
  }

  switch (provider) {
    case "resend": {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html, text: params.text }),
      });
      if (!res.ok) throw new Error(`Resend error (${res.status}): ${await res.text()}`);
      break;
    }

    case "sendgrid": {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: from },
          subject: params.subject,
          content: [
            { type: "text/html", value: params.html },
            ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
          ],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid error (${res.status}): ${await res.text()}`);
      break;
    }

    default:
      console.warn(`[EMAIL] Unknown provider: ${provider}`);
  }
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  body: string
): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "log";
  // M-3: escape konten user agar tidak terjadi email HTML injection
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body);
  if (!provider || provider === "log") {
    console.log(`[EMAIL] To: ${email}, Subject: ${safeSubject}, Body: ${safeBody}`);
    return;
  }
  await sendEmail({
    to: email,
    subject: safeSubject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e293b;">${safeSubject}</h2>
      <p style="color:#475569;">${safeBody}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="color:#94a3b8;font-size:12px;">SpringHub — Jaga Semesta</p>
    </div>`,
    text: body,
  });
}

export function buildResetPasswordEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Reset Password — SpringHub",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Reset Password</h2>
        <p style="color: #475569;">Klik tombol di bawah untuk mereset password akun SpringHub Anda.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0891b2; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 12px;">Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
    text: `Reset Password — SpringHub\n\nKlik link berikut untuk mereset password:\n${resetUrl}\n\nLink ini berlaku selama 1 jam.`,
  };
}

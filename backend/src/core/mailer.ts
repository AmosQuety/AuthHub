import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Mailer — thin singleton wrapper around nodemailer.
// Configure via environment variables.
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, STARTTLS for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async (opts: MailOptions): Promise<void> => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "AuthHub <no-reply@authhub.dev>",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
};

// ---------------------------------------------------------------------------
// Pre-built email templates
// ---------------------------------------------------------------------------

export const buildVerificationEmail = (verifyUrl: string): string => `
<div style="font-family:sans-serif;max-width:500px;margin:auto">
  <h2>Verify your email address</h2>
  <p>Click the button below to verify your email. This link expires in <strong>24 hours</strong>.</p>
  <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
    Verify Email
  </a>
  <p style="color:#666;font-size:0.85em;margin-top:24px">
    If you didn't create an account, you can safely ignore this email.
  </p>
</div>`;

export const buildPasswordResetEmail = (resetUrl: string): string => `
<div style="font-family:sans-serif;max-width:500px;margin:auto">
  <h2>Reset your password</h2>
  <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
  <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
    Reset Password
  </a>
  <p style="color:#666;font-size:0.85em;margin-top:24px">
    If you didn't request this, you can safely ignore this email. Your password will not change.
  </p>
</div>`;

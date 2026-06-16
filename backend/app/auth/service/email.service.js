import { resend } from '../../../config/resend.js';
import { env } from '../../../config/env.js';

export const sendEmail = async (to, subject, text, html) => {
  await resend.emails.send({
    from: env.email.from,
    to,
    subject,
    text,
    html,
  });
};

export const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetUrl = `${env.frontendOrigin}/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetUrl}
If you did not request this, ignore this email.`;
  const html = `<p>To reset your password, click <a href="${resetUrl}">here</a>.</p>
    <p>If you did not request this, ignore this email.</p>`;
  await sendEmail(to, subject, text, html);
};

export const sendVerificationEmail = async (to, token) => {
  const subject = 'Verify your email';
  const verifyUrl = `${env.frontendOrigin}/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verifyUrl}
If you did not create an account, ignore this email.`;
  const html = `<p>To verify your email, click <a href="${verifyUrl}">here</a>.</p>
    <p>If you did not create an account, ignore this email.</p>`;
  await sendEmail(to, subject, text, html);
};

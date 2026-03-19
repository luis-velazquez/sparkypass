import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromAddress =
  process.env.EMAIL_FROM || "SparkyPass <onboarding@resend.dev>";

// Escape HTML special characters to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
) {
  const safeName = escapeHtml(name);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Verify your email to get started with SparkyPass",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; text-align: center;">&#9889; SparkyPass</h1>
        <h2 style="text-align: center;">Verify Your Email</h2>
        <p>Hi ${safeName},</p>
        <p>Thanks for signing up for SparkyPass! Click the button below to verify your email and set up your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #f59e0b; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email &amp; Create Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn&#39;t create a SparkyPass account, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nThanks for signing up for SparkyPass! Please verify your email and set up your password by visiting:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create a SparkyPass account, you can safely ignore this email.`,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendWelcomeTrialEmail(to: string, name: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const safeName = escapeHtml(name);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Welcome to SparkyPass — Your 7-Day Free Trial is Active!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1e293b; color: #e2e8f0;">
        <h1 style="color: #f59e0b; text-align: center;">&#9889; SparkyPass</h1>
        <h2 style="text-align: center; color: #f8fafc;">Your 7-Day Free Trial is Active!</h2>
        <p>Hey ${safeName},</p>
        <p>Welcome to SparkyPass! Your free trial is now active &#8212; you have <strong style="color: #f59e0b;">7 full days</strong> of unlimited access to every study tool on the platform.</p>

        <div style="background-color: #334155; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #f59e0b; margin-top: 0;">Start Here: Take a Practice Quiz</h3>
          <p style="margin-bottom: 16px;">Jump straight into a <strong>10-question NEC quiz</strong> to see where you stand. Our quizzes cover all major exam topics with instant feedback and detailed NEC code references.</p>
          <div style="text-align: center;">
            <a href="${baseUrl}/quiz" style="background-color: #f59e0b; color: #1e293b; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Take Your First Quiz
            </a>
          </div>
        </div>

        <h3 style="color: #f8fafc;">What&#39;s Included in Your Trial:</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;">500+ NEC practice questions with explanations</li>
          <li style="margin-bottom: 8px;">Flashcards for key formulas &amp; code references</li>
          <li style="margin-bottom: 8px;">Timed mock exams that mirror the real test</li>
          <li style="margin-bottom: 8px;">Load calculator tools for real-world practice</li>
          <li style="margin-bottom: 8px;">Progress tracking &amp; daily challenges</li>
        </ul>

        <div style="background-color: #334155; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">No credit card was collected. Your trial expires automatically &#8212; no surprise charges, ever. Your study progress is saved even after the trial ends.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #475569; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Questions? Reply to this email &#8212; we&#39;re happy to help.<br />
          SparkyPass &#8212; Pass the NEC Exam &amp; Master the Code
        </p>
      </div>
    `,
    text: `Hey ${name},\n\nWelcome to SparkyPass! Your 7-day free trial is now active.\n\nStart here: Take a practice quiz at ${baseUrl}/quiz to see where you stand.\n\nWhat's included:\n- 500+ NEC practice questions\n- Flashcards for key formulas\n- Timed mock exams\n- Load calculator tools\n- Progress tracking & daily challenges\n\nNo credit card was collected. Your trial expires automatically — no surprise charges. Your progress is saved even after the trial ends.\n\nGood luck!\nSparkyPass`,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const safeName = escapeHtml(name);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Reset your SparkyPass password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; text-align: center;">&#9889; SparkyPass</h1>
        <h2 style="text-align: center;">Reset Your Password</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn&#39;t request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password. Visit the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

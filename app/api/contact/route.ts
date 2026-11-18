import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { INFO_EMAIL } from "@/lib/site";

// In-memory rate limiting store
// In production, use Redis or database-backed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS_PER_HOUR = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2000;

// Get client IP from request
function getClientIP(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Return first IP in the chain
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to a hash of user agent + accept headers for uniqueness
  const ua = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  return `unknown-${hashString(ua + accept)}`;
}

// Simple string hash for fallback IP identification
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Check rate limit and update counter
function checkRateLimit(ip: string): { allowed: boolean; resetInSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // First request or window expired - reset counter
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + HOUR_IN_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    // Rate limit exceeded
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, resetInSeconds };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(ip, entry);
  return { allowed: true };
}

// Strip HTML tags from string
function stripHtmlTags(str: string): string {
  // Remove all HTML tags
  return str.replace(/<[^>]*>/g, "");
}

// Escape special characters to prevent XSS
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

// Sanitize input: strip HTML tags, escape special chars, trim whitespace
function sanitizeInput(str: string): string {
  return escapeHtml(stripHtmlTags(str.trim()));
}

// Validate name: letters, spaces, hyphens, apostrophes only
function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return nameRegex.test(name);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      const minutesLeft = Math.ceil((rateLimitResult.resetInSeconds || 0) / 60);
      return NextResponse.json(
        {
          error: `Too many messages. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.resetInSeconds || 60),
          },
        }
      );
    }

    const body = await request.json();
    const { name, email, message, website } = body;

    // Honeypot check - if filled, silently reject (bot detected)
    if (website) {
      // Log potential bot but return success to fool it
      console.log("[CONTACT FORM] Bot detected (honeypot filled):", { ip: clientIP });
      return NextResponse.json({ success: true });
    }

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedMessage = sanitizeInput(message);

    // Validate lengths after sanitization
    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (sanitizedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate name format - check raw name before HTML escaping
    if (!isValidName(stripHtmlTags(name.trim()))) {
      return NextResponse.json(
        { error: "Name can only contain letters, spaces, hyphens, and apostrophes" },
        { status: 400 }
      );
    }

    if (sanitizedEmail.length === 0) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (sanitizedEmail.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: `Email must be ${MAX_EMAIL_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate email format - check raw email before escaping
    const rawEmail = stripHtmlTags(email.trim()).toLowerCase();
    if (!isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (sanitizedMessage.length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Get contact email from environment
    const contactEmail = process.env.CONTACT_EMAIL || INFO_EMAIL;

    // Build plain text email content
    const emailContent = `
New Contact Form Submission
============================

From: ${stripHtmlTags(name.trim())}
Email: ${rawEmail}
IP: ${clientIP}
Submitted: ${new Date().toISOString()}

Message:
${stripHtmlTags(message.trim())}

============================
This message was sent via the SparkyPass contact form.
`.trim();

    // Send contact form email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.EMAIL_FROM || "SparkyPass <onboarding@resend.dev>";

    try {
      await resend.emails.send({
        from: fromAddress,
        to: contactEmail,
        subject: `SparkyPass Contact: ${stripHtmlTags(name.trim())}`,
        replyTo: rawEmail,
        text: emailContent,
      });
    } catch (emailError) {
      console.error("[CONTACT FORM] Failed to send email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTACT FORM] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Loader2, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2000;

// Validate name: letters, spaces, hyphens, apostrophes only
function isValidName(name: string): boolean {
  // Allow letters (including accented), spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return nameRegex.test(name);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap - should remain empty
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // If honeypot is filled, silently reject (bot detected)
    if (honeypot) {
      // Pretend success to fool bots
      setIsSubmitted(true);
      return;
    }

    // Client-side validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (!isValidName(trimmedName)) {
      setError("Name can only contain letters, spaces, hyphens, and apostrophes");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }

    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      setError(`Email must be ${MAX_EMAIL_LENGTH} characters or less`);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!trimmedMessage) {
      setError("Please enter a message");
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
          website: honeypot, // Include honeypot for server-side check
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-cream dark:bg-stone-950 relative">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            {isSubmitted ? (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-emerald/10 p-4">
                    <CheckCircle className="h-12 w-12 text-emerald" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold font-display">
                  Message Sent!
                </CardTitle>
                <p className="text-muted-foreground">
                  Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-purple/10 p-4">
                    <Mail className="h-12 w-12 text-purple" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold font-display">
                  Contact Us
                </CardTitle>
                <p className="text-muted-foreground">
                  Have questions, feedback, or need help? We&apos;d love to hear from you!
                </p>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isSubmitted ? (
              <>
                {/* Sparky thanks */}
                <SparkyMessage
                  message="Thanks for getting in touch! We appreciate you taking the time to reach out. Our team will review your message and respond soon. In the meantime, keep studying - you've got this!"
                  size="small"
                />

                {/* Back to Home */}
                <div className="text-center space-y-4">
                  <Link href="/">
                    <Button className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Sparky encouragement */}
                <SparkyMessage
                  message="Hey there! Got a question or want to share feedback? I'll make sure your message gets to the right people!"
                  size="small"
                />

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field - hidden from real users, bots will fill it */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">
                      Website
                      <input
                        type="text"
                        id="website"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                      disabled={isLoading}
                      autoComplete="name"
                      maxLength={MAX_NAME_LENGTH}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {name.length}/{MAX_NAME_LENGTH}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.slice(0, MAX_EMAIL_LENGTH))}
                      disabled={isLoading}
                      autoComplete="email"
                      maxLength={MAX_EMAIL_LENGTH}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                      disabled={isLoading}
                      rows={5}
                      maxLength={MAX_MESSAGE_LENGTH}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/{MAX_MESSAGE_LENGTH}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>

                {/* Back to Home */}
                <div className="text-center">
                  <Link
                    href="/"
                    className="text-sm text-amber hover:text-amber-dark inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

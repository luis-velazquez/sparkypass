"use client";

import { redirect } from "next/navigation";

// Apprentice flashcards — redirect to main flashcards for now
// TODO: filter flashcards by apprentice difficulty when the data supports it
export default function ApprenticeFlashcardsPage() {
  redirect("/flashcards");
}

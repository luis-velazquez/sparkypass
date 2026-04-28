"use client";

import { useParams } from "next/navigation";
import { redirect } from "next/navigation";

export default function ApprenticeQuizCategoryPage() {
  const params = useParams();
  const category = params.category as string;
  redirect(`/quiz/${category}?difficulty=apprentice`);
}

import type { Metadata } from "next";
import { Site } from "../page";

export const metadata: Metadata = {
  title: "Advanced Basics Trading Company",
  description:
    "A medical supply company providing quality products, reliable delivery, tender support, and healthcare solutions across Saudi Arabia.",
  alternates: {
    canonical: "/en",
    languages: {
      ar: "/",
      en: "/en",
      "x-default": "/",
    },
  },
};

export default function EnglishPage() {
  return <Site initialLang="en" />;
}

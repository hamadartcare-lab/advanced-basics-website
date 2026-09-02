import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://advancebasics.com/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          ar: "https://advancebasics.com/",
          en: "https://advancebasics.com/en",
        },
      },
    },
    {
      url: "https://advancebasics.com/en",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: {
          ar: "https://advancebasics.com/",
          en: "https://advancebasics.com/en",
        },
      },
    },
  ];
}

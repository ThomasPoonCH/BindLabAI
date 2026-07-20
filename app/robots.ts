import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/dashboard", "/dashboard/reaction/new", "/dashboard/calculators", "/dashboard/dilution", "/dashboard/lcms", "/dashboard/experiments", "/dashboard/bench-mode-demo", "/analysis", "/privacy", "/terms", "/data-handling"],
      disallow: ["/api/", "/account", "/auth", "/dashboard/funding", "/dashboard/new", "/dashboard/project/"],
    },
  };
}

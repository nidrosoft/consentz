import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.consentz.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/sign-in", "/sign-up"],
                disallow: ["/api/", "/settings", "/audits"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}

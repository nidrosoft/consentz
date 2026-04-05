import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Consentz — CQC Compliance Platform",
        short_name: "Consentz",
        description:
            "CQC compliance management for UK aesthetic clinics and care homes. Automated gap analysis, AI-powered policies, evidence tracking, and real-time scoring.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1f6068",
        orientation: "portrait-primary",
        categories: ["business", "healthcare", "productivity"],
        icons: [
            { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
    };
}

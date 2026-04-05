import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RouteProvider } from "@/providers/router-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SignOutConfirmProvider } from "@/providers/sign-out-confirm-provider";
import { Theme } from "@/providers/theme";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.consentz.com";

export const metadata: Metadata = {
    metadataBase: new URL(APP_URL),
    title: {
        default: "Consentz — CQC Compliance Platform for UK Healthcare",
        template: "%s | Consentz",
    },
    description:
        "Achieve outstanding CQC ratings with confidence. Consentz helps aesthetic clinics and care homes manage compliance across all 5 CQC domains — automated gap analysis, AI-powered policies, evidence tracking, staff management, and real-time scoring.",
    keywords: [
        "CQC compliance",
        "CQC rating",
        "care quality commission",
        "healthcare compliance",
        "aesthetic clinic compliance",
        "care home compliance",
        "CQC inspection preparation",
        "CQC gap analysis",
        "UK healthcare regulation",
        "KLOE",
        "key lines of enquiry",
        "compliance management software",
        "CQC domains",
        "safe effective caring responsive well-led",
        "Consentz",
    ],
    authors: [{ name: "Consentz", url: "https://consentz.com" }],
    creator: "Consentz",
    publisher: "Consentz",
    applicationName: "Consentz",
    category: "Healthcare Compliance",
    openGraph: {
        type: "website",
        locale: "en_GB",
        url: APP_URL,
        siteName: "Consentz",
        title: "Consentz — CQC Compliance Platform for UK Healthcare",
        description:
            "Manage CQC compliance across all 5 domains. Automated gap analysis, AI-powered policy generation, evidence tracking, staff management, and real-time compliance scoring for aesthetic clinics and care homes.",
        images: [
            {
                url: `${APP_URL}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Consentz — CQC Compliance Dashboard",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Consentz — CQC Compliance Platform",
        description:
            "Achieve outstanding CQC ratings. Compliance management for UK aesthetic clinics and care homes.",
        images: [`${APP_URL}/og-image.png`],
        creator: "@consentz",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    icons: {
        icon: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    alternates: {
        canonical: APP_URL,
    },
};

export const viewport: Viewport = {
    themeColor: "#1f6068",
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cx(inter.variable, "bg-primary antialiased")} suppressHydrationWarning>
                <QueryProvider>
                    <RouteProvider>
                        <Theme>
                            <SignOutConfirmProvider>{children}</SignOutConfirmProvider>
                        </Theme>
                    </RouteProvider>
                </QueryProvider>
            </body>
        </html>
    );
}

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

export const metadata: Metadata = {
    title: "CQC Compliance Platform — Consentz",
    description: "Achieve outstanding CQC ratings with confidence. Compliance management for UK healthcare providers.",
};

export const viewport: Viewport = {
    themeColor: "#1f6068",
    colorScheme: "light dark",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cx(inter.variable, "bg-primary antialiased")}>
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

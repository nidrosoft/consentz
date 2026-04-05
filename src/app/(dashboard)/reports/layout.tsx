import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reports",
    description:
        "Generate compliance reports, domain breakdowns, and CQC inspection preparation documents. Export as PDF or CSV.",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

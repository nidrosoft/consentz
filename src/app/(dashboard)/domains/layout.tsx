import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CQC Domains",
    description:
        "Monitor compliance across all 5 CQC domains — Safe, Effective, Caring, Responsive, and Well-Led. View KLOE scores, identify gaps, and track remediation progress.",
};

export default function DomainsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

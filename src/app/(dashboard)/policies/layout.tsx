import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Policies",
    description:
        "Manage CQC-compliant policies with version control, approval workflows, and AI-powered generation. Covers all required policies across the 14 Fundamental Standards.",
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
    return children;
}

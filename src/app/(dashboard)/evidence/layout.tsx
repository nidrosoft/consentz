import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Evidence Library",
    description:
        "Upload, organise, and track compliance evidence documents. Link evidence to CQC domains and KLOEs with automated expiry monitoring.",
};

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
    return children;
}

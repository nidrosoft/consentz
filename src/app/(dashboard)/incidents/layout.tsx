import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Incidents",
    description:
        "Report and investigate clinical incidents with severity classification, root cause analysis, and CQC regulation linking.",
};

export default function IncidentsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Directory",
    description:
        "Manage staff profiles, DBS clearances, GMC registrations, training records, and credential expiry tracking for CQC compliance.",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return children;
}

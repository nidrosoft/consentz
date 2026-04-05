import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings",
    description:
        "Manage your organisation profile, team members, billing, integrations, and notification preferences.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

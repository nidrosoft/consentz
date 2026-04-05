import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Audit Log",
    description:
        "Immutable audit trail of all platform activity. 7-year retention per NHS Records Management Code. Filterable by user, entity, and action.",
};

export default function AuditsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Consentz",
    description: "Create your Consentz account and start managing CQC compliance for your healthcare organisation.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
    return children;
}

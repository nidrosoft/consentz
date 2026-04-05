import { Suspense } from "react";
import type { Metadata } from "next";

import { SignInClient } from "./sign-in-client";

export const metadata: Metadata = {
    title: "Sign In | Consentz",
    description: "Sign in to your Consentz CQC compliance dashboard.",
};

export default function SignInPage() {
    return (
        <Suspense fallback={null}>
            <SignInClient />
        </Suspense>
    );
}

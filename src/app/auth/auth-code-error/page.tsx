import Link from "next/link";
import { AlertCircle } from "@untitledui/icons";

export default function AuthCodeErrorPage() {
    return (
        <>
            <div className="flex flex-col gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-error-secondary">
                    <AlertCircle className="size-6 text-fg-error-primary" />
                </div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Sign-in link problem</h1>
                <p className="text-md text-tertiary">
                    We couldn&apos;t complete sign-in from that link. It may have expired or already been used.
                    Request a new email or try signing in again.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <Link
                    href="/forgot-password"
                    className="flex w-full items-center justify-center rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover"
                >
                    Request new link
                </Link>
                <Link
                    href="/sign-in"
                    className="text-center text-sm font-semibold text-brand-secondary transition duration-100 hover:text-brand-primary"
                >
                    Back to sign in
                </Link>
            </div>
        </>
    );
}

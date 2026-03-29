import Link from "next/link";

export default function AuthCodeErrorPage() {
    return (
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center gap-4 px-4">
            <h1 className="text-display-xs font-semibold text-primary">Sign-in link problem</h1>
            <p className="text-md text-tertiary">
                We couldn&apos;t complete sign-in from that link. It may have expired. Request a new email or try signing in
                again.
            </p>
            <Link href="/sign-in" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary">
                Back to sign in
            </Link>
        </div>
    );
}

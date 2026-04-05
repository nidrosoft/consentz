"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { signOutEverywhere } from "@/lib/supabase/client-sign-out";
import { toast } from "@/lib/toast";

type SignOutConfirmContextValue = {
    requestSignOutConfirm: () => void;
};

const SignOutConfirmContext = createContext<SignOutConfirmContextValue | null>(null);

export function useSignOutConfirm(): SignOutConfirmContextValue {
    const ctx = useContext(SignOutConfirmContext);
    if (!ctx) {
        throw new Error("useSignOutConfirm must be used within SignOutConfirmProvider");
    }
    return ctx;
}

export function SignOutConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);

    const requestSignOutConfirm = useCallback(() => setOpen(true), []);

    const value = useMemo(
        () => ({ requestSignOutConfirm }),
        [requestSignOutConfirm],
    );

    async function confirmSignOut() {
        setOpen(false);
        toast.info("Signing out…", "You are being signed out.");
        await signOutEverywhere();
    }

    return (
        <SignOutConfirmContext.Provider value={value}>
            {children}
            <ModalOverlay isOpen={open} onOpenChange={setOpen} isDismissable>
                <Modal className="w-full max-w-md">
                    <Dialog
                        data-testid="sign-out-dialog"
                        className="flex-col items-stretch rounded-xl bg-primary p-5 shadow-xl ring-1 ring-secondary sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-primary">Sign out?</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    You will be signed out completely on this browser. Unsaved changes may be lost.
                                </p>
                            </div>
                            <CloseButton size="sm" onPress={() => setOpen(false)} />
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                            <Button color="secondary" size="md" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                color="primary-destructive"
                                size="md"
                                className="w-full sm:w-auto"
                                onClick={() => void confirmSignOut()}
                            >
                                Sign out
                            </Button>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </SignOutConfirmContext.Provider>
    );
}

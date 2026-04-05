"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IncidentDetailRedirect() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";

    useEffect(() => {
        router.replace(`/incidents?detail=${id}`);
    }, [id, router]);

    return null;
}

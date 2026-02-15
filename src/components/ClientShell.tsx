"use client";

import { Header } from "@/components/Header";
import { Providers } from "@/providers/providers";

export function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            <Header />
            {children}
        </Providers>
    );
}

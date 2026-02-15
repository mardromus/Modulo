"use client";

import { Providers } from "@/providers/providers";

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <div className="embed-layout" style={{ minHeight: "100vh", background: "transparent" }}>
                {children}
            </div>
        </Providers>
    );
}

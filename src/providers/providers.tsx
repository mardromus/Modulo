"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

const alphaUsd = "0x20c0000000000000000000000000000000000001";

// Define Tempo Moderato chain for Privy
const tempoModerato = defineChain({
    id: 42431,
    name: "Tempo Moderato",
    nativeCurrency: { name: "AlphaUSD", symbol: "aUSD", decimals: 6 },
    rpcUrls: {
        default: { http: ["https://rpc.moderato.tempo.xyz"] },
    },
    blockExplorers: {
        default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
    },
    feeToken: alphaUsd,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    // If no Privy app ID, render children without auth (demo mode)
    if (!appId) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <BasePrivyProvider
            appId={appId}
            config={{
                loginMethods: ["google", "email", "sms", "wallet"],
                defaultChain: tempoModerato,
                supportedChains: [tempoModerato],
                appearance: {
                    theme: "dark",
                    accentColor: "#7c3aed",
                    logo: undefined,
                },
                embeddedWallets: {
                    ethereum: { createOnLogin: "all-users" },
                    showWalletUIs: false,
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BasePrivyProvider>
    );
}

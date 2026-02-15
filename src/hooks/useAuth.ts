"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMemo } from "react";

export function useAuth() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const { wallets } = useWallets();

    const walletAddress = useMemo(() => {
        if (!wallets || wallets.length === 0) return null;
        // Prefer the embedded wallet
        const embedded = wallets.find((w) => w.walletClientType === "privy");
        return (embedded?.address || wallets[0]?.address) ?? null;
    }, [wallets]);

    const displayAddress = useMemo(() => {
        if (!walletAddress) return null;
        return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }, [walletAddress]);

    const displayName = useMemo(() => {
        if (!user) return null;
        if (user.google?.name) return user.google.name;
        if (user.email?.address) return user.email.address.split("@")[0];
        if (user.phone?.number) return user.phone.number;
        return displayAddress;
    }, [user, displayAddress]);

    return {
        ready,
        isLoggedIn: ready && authenticated,
        user,
        walletAddress: walletAddress as `0x${string}` | null,
        displayAddress,
        displayName,
        login,
        logout,
        wallets,
    };
}

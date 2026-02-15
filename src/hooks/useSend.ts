"use client";

import { useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { tempoModerato } from "viem/chains";
import { tempoActions } from "viem/tempo";
import {
    createWalletClient,
    custom,
    parseUnits,
    stringToHex,
    pad,
    type Address,
} from "viem";

const alphaUsd = "0x20c0000000000000000000000000000000000001" as Address;

export function useSend() {
    const { wallets } = useWallets();
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const send = async (to: string, amount: string, memo: string = "") => {
        if (isSending) return;
        setIsSending(true);
        setError(null);
        setTxHash(null);

        const wallet =
            wallets.find((w) => w.walletClientType === "privy") || wallets[0];
        if (!wallet?.address) {
            const errMsg = "No active wallet. Please log in first.";
            setError(errMsg);
            setIsSending(false);
            throw new Error(errMsg);
        }

        try {
            const provider = await wallet.getEthereumProvider();
            const client = createWalletClient({
                account: wallet.address as Address,
                chain: tempoModerato,
                transport: custom(provider),
            }).extend(tempoActions());

            const metadata = await client.token.getMetadata({
                token: alphaUsd,
            });

            // Resolve recipient: if it's an email/phone, look up via API
            let recipient: Address;
            if (to.startsWith("0x") && to.length === 42) {
                recipient = to as Address;
            } else {
                const res = await fetch("/api/auth/privy-callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: to }),
                });
                if (!res.ok) throw new Error("Failed to resolve recipient address");
                const data = await res.json();
                recipient = data.address as Address;
            }

            const memoHex = memo
                ? pad(stringToHex(memo), { size: 32 })
                : pad(stringToHex(to.slice(0, 24)), { size: 32 });

            const { receipt } = await client.token.transferSync({
                to: recipient,
                amount: parseUnits(amount, metadata.decimals),
                memo: memoHex,
                token: alphaUsd,
            });

            setTxHash(receipt.transactionHash);
            return receipt.transactionHash;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to send";
            setError(errorMessage);
            throw err;
        } finally {
            setIsSending(false);
        }
    };

    return {
        send,
        isSending,
        error,
        txHash,
        reset: () => {
            setError(null);
            setTxHash(null);
        },
    };
}

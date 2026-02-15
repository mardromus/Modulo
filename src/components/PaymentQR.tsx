"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface PaymentQRProps {
    checkoutUrl: string;
    amount?: string;
    productName?: string;
    size?: number;
}

/**
 * QR Code component for checkout payment links.
 * Generates a scannable QR code pointing to the checkout page.
 */
export function PaymentQR({ checkoutUrl, amount, productName, size = 180 }: PaymentQRProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(checkoutUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="qr-wrapper">
            <div className="qr-container">
                <QRCodeSVG
                    value={checkoutUrl}
                    size={size}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#08080c"
                    includeMargin={false}
                />
            </div>
            {productName && (
                <div style={{ marginTop: 14, fontWeight: 700, fontSize: "0.9rem" }}>
                    {productName}
                </div>
            )}
            {amount && (
                <div className="gradient-text" style={{ fontWeight: 800, fontSize: "1.2rem", marginTop: 4 }}>
                    ${amount}
                </div>
            )}
            <p style={{ marginTop: 8 }}>Scan to pay with AlphaUSD</p>
            <button
                onClick={handleCopy}
                className="btn-secondary"
                style={{ marginTop: 12, fontSize: "0.75rem", padding: "6px 16px" }}
            >
                {copied ? "Copied!" : "Copy Link"}
            </button>
        </div>
    );
}

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkoutUrl: string;
    amount?: string;
    productName?: string;
}

/**
 * Modal overlay for displaying a payment QR code.
 */
export function QRModal({ isOpen, onClose, checkoutUrl, amount, productName }: QRModalProps) {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                animation: "fadeInUp 0.2s ease-out",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="card"
                style={{
                    padding: "36px",
                    textAlign: "center",
                    maxWidth: 340,
                    background: "rgba(15, 15, 22, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <h3 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 20 }}>
                    Payment QR Code
                </h3>
                <PaymentQR
                    checkoutUrl={checkoutUrl}
                    amount={amount}
                    productName={productName}
                    size={200}
                />
                <button
                    onClick={onClose}
                    className="btn-ghost"
                    style={{ marginTop: 16, width: "100%" }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
    const { user } = useAuth();
    const [merchant, setMerchant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/merchants?privyId=${user.id}`)
            .then(r => r.json())
            .then(data => {
                if (data.merchants && data.merchants.length > 0) {
                    setMerchant(data.merchants[0]);
                }
                setLoading(false);
            });
    }, [user?.id]);

    if (loading) return <div className="page-center"><div className="spinner" /></div>;

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 600 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Settings</h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                        Update your merchant profile and preferences
                    </p>
                </div>

                <div className="card">
                    <div className="form-group">
                        <label className="form-label">Merchant ID</label>
                        <input type="text" value={merchant?.id || ""} disabled style={{ opacity: 0.6 }} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Business Name</label>
                        <input type="text" defaultValue={merchant?.name} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gas Sponsorship Wallet</label>
                        <input type="text" defaultValue={merchant?.sponsorWallet || "Not Configured"} disabled />
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                            Contact support to changeyour sponsorship wallet.
                        </p>
                    </div>

                    <div style={{ marginTop: 32 }}>
                        <button className="btn-primary" style={{ width: "100%" }}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
    const { ready, isLoggedIn, displayName, displayAddress, login, logout } =
        useAuth();

    return (
        <nav className="navbar">
            <div className="container">
                <Link href="/" style={{ fontSize: "1.2rem", fontWeight: 800, textDecoration: "none", color: "white" }}>
                    Modulo
                </Link>
                <div className="navbar-links">
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/products/new">Products</Link>
                    <Link href="/agents">Agents</Link>
                    <Link
                        href="/ai"
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                        🧠 AI
                    </Link>

                    {/* Auth Section */}
                    {!ready ? (
                        <div className="nav-auth-skeleton" />
                    ) : isLoggedIn ? (
                        <div className="nav-user">
                            <div className="nav-wallet-badge">
                                <div className="nav-wallet-dot" />
                                <span className="nav-wallet-address">{displayAddress}</span>
                            </div>
                            {displayName && displayName !== displayAddress && (
                                <span className="nav-user-name">{displayName}</span>
                            )}
                            <button onClick={logout} className="btn-ghost nav-logout-btn">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={login} className="btn-primary nav-connect-btn">
                            🔗 Connect
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";


export function Header() {
    const { ready, isLoggedIn, displayAddress, displayName, login, logout } = useAuth();
    const pathname = usePathname();

    return (
        <header className="header">
            <div className="container">
                <Link href="/" className="logo">
                    Modulo
                </Link>
                <div className="header-nav">
                    <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
                    {isLoggedIn && (
                        <>
                            <Link href="/dashboard/products" className={pathname.includes("/products") ? "active" : ""}>Products</Link>
                            <Link href="/dashboard/customers" className={pathname.includes("/customers") ? "active" : ""}>Customers</Link>
                        </>
                    )}
                    <Link href="/ai" className={pathname === "/ai" ? "active" : ""}>AI</Link>

                    <div className="header-connect">
                        {!ready ? null : isLoggedIn ? (
                            <>
                                <div className="header-wallet">
                                    <span className="header-wallet-dot" />
                                    {displayName || displayAddress}
                                </div>
                                <Link href="/dashboard/settings" title="Settings" className="btn-ghost" style={{ padding: "6px 8px" }}>
                                    ⚙️
                                </Link>
                                <button onClick={logout} className="btn-ghost" style={{ fontSize: "0.75rem" }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button onClick={login} className="btn-primary" style={{ padding: "5px 14px", fontSize: "0.78rem", borderRadius: 100 }}>
                                Connect
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface AgentTerminalProps {
    logs: string[];
    height?: string;
    title?: string;
}

export default function AgentTerminal({ logs, height = "300px", title = "AGENT_EXECUTION_LOG" }: AgentTerminalProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="card" style={{
            padding: 0,
            overflow: "hidden",
            background: "#08080c",
            border: "1px solid var(--card-border)",
            display: "flex",
            flexDirection: "column",
            height: height,
            position: "relative"
        }}>
            {/* Terminal Header */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                padding: "8px 16px",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                </div>
                <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                    {title}
                </div>
                <div style={{ width: 30 }} />
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="terminal-body"
                style={{
                    flex: 1,
                    padding: "16px",
                    overflowY: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    scrollBehavior: "smooth"
                }}
            >
                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: 4, display: "flex", gap: 8, lineHeight: "1.4" }}>
                        <span style={{ color: "var(--text-muted)", flexShrink: 0, userSelect: "none" }}>{">"}</span>
                        <span style={{
                            color: log.includes("[ERROR]") ? "#ef4444" :
                                log.includes("Success") || log.includes("Completed") ? "#10b981" :
                                    log.includes("[AI]") ? "#a8a29e" : "inherit"
                        }}>
                            {log}
                        </span>
                    </div>
                ))}
                {/* Blinking Cursor */}
                <span style={{
                    display: "inline-block",
                    width: "8px",
                    height: "14px",
                    background: "var(--accent)",
                    verticalAlign: "middle",
                    marginLeft: "8px",
                    animation: "blink 1s step-end infinite"
                }} />
            </div>

            <style jsx>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
        </div>
    );
}

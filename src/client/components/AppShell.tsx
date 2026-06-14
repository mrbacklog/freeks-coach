import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

// SVG icons (inline, minimal)
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--accent)" : "var(--text-ghost)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Vandaag"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--accent)" : "var(--text-ghost)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Week"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BarChartIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--accent)" : "var(--text-ghost)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Stats"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--accent)" : "var(--text-ghost)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Coach"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-ghost)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Meer"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [meerOpen, setMeerOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", label: "Vandaag", icon: HomeIcon },
    { path: "/week", label: "Week", icon: CalendarIcon },
    { path: "/measurements", label: "Stats", icon: BarChartIcon },
    { path: "/exercises", label: "Coach", icon: BookIcon },
  ];

  const closeMeer = () => setMeerOpen(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "64px", // Reserve space for bottom nav
        }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
        }}
      >
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "8px 16px",
                textDecoration: "none",
                position: "relative",
              }}
            >
              <Icon active={active} />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: active ? "var(--accent)" : "var(--text-ghost)",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </Link>
          );
        })}

        {/* Meer button */}
        <button
          type="button"
          onClick={() => setMeerOpen(true)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            padding: "8px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <MoreIcon />
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-condensed)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--text-ghost)",
              textTransform: "uppercase",
            }}
          >
            Meer
          </span>
        </button>
      </nav>

      {/* Meer drawer overlay */}
      {meerOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Sluit menu"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 200,
            }}
            onClick={closeMeer}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                closeMeer();
              }
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--border)",
              borderRadius: "16px 16px 0 0",
              padding: "24px",
              zIndex: 201,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "4px",
                background: "var(--border)",
                borderRadius: "2px",
                margin: "0 auto 24px",
              }}
            />
            {[
              { path: "/goals", label: "Doelen" },
              { path: "/history", label: "Geschiedenis" },
              { path: "/settings", label: "Instellingen" },
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMeer}
                style={{
                  display: "block",
                  padding: "16px 0",
                  fontSize: "var(--text-lg)",
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  borderBottom: "1px solid var(--border)",
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

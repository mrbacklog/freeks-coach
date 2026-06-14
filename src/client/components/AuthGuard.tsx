import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          setStatus("unauthenticated");
        } else {
          setStatus("authenticated");
        }
      })
      .catch(() => setStatus("unauthenticated"));
  }, []);

  if (status === "loading") return <div style={{ color: "white", padding: "20px" }}>Laden...</div>;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

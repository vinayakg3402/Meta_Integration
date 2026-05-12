// frontend/src/pages/AuthSuccess.jsx
// Handles the redirect from backend after OAuth, extracts token from URL

import { useEffect } from "react";
import { setToken } from "../utils/api";

export default function AuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setToken(token);
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/?error=no_token";
    }
  }, []);

  return <div style={{ textAlign: "center", marginTop: 100 }}>Connecting your account…</div>;
}

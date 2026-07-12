"use client";

import { useEffect } from "react";

import { hasRecoveryParamsInLocation } from "@/lib/auth-recovery";

export function RecoveryLinkRedirect() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;

    if (pathname === "/reset-password" || pathname.startsWith("/auth/")) {
      return;
    }

    if (!hasRecoveryParamsInLocation(search, hash)) {
      return;
    }

    window.location.replace(`/reset-password${search}${hash}`);
  }, []);

  return null;
}

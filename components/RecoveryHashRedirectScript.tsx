import { RECOVERY_HASH_REDIRECT_SCRIPT } from "@/lib/auth-recovery";

export function RecoveryHashRedirectScript() {
  return (
    <script
      id="recovery-hash-redirect"
      dangerouslySetInnerHTML={{ __html: RECOVERY_HASH_REDIRECT_SCRIPT }}
    />
  );
}

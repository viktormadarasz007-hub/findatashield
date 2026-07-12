const PASSWORD_RESET_SUCCESS =
  "Password reset email sent — check your inbox";

const PASSWORD_RESET_NOT_FOUND =
  "No account found with that email address";

const PASSWORD_RESET_GENERIC =
  "Something went wrong — please try again or contact viktorm@findatashield.com";

function readAuthErrorFields(error: unknown): {
  message: string;
  code: string;
  status: number | null;
} {
  if (!error || typeof error !== "object") {
    return { message: "", code: "", status: null };
  }

  const record = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
  const status = typeof record.status === "number" ? record.status : null;

  return { message, code, status };
}

function isEmailNotFoundError(
  message: string,
  code: string,
  status: number | null,
): boolean {
  if (code === "user_not_found" || status === 404) {
    return true;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("user not found") ||
    normalized.includes("no user found") ||
    normalized.includes("account not found") ||
    normalized.includes("email not found") ||
    normalized.includes("unable to validate email") ||
    normalized.includes("user with this email not found")
  );
}

export function getPasswordResetErrorMessage(error: unknown): string {
  const { message, code, status } = readAuthErrorFields(error);

  if (isEmailNotFoundError(message, code, status)) {
    return PASSWORD_RESET_NOT_FOUND;
  }

  return PASSWORD_RESET_GENERIC;
}

export function getPasswordResetSuccessMessage(): string {
  return PASSWORD_RESET_SUCCESS;
}

import { ForbiddenError, AuthError } from "@/lib/auth/errors";

/**
 * Only errors we deliberately threw with a user-safe message are shown
 * verbatim. Anything else (Prisma errors, unexpected exceptions) falls
 * back to a generic message so internals never leak to the client.
 */
export function safeErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ForbiddenError || error instanceof AuthError) {
    return error.message;
  }

  if (error instanceof KnownError) {
    return error.message;
  }

  return fallback;
}

/**
 * Throw this (instead of a plain Error) for any user-facing validation
 * message from a service function — e.g. "An account with this email
 * already exists." Plain `throw new Error(...)` is treated as an
 * internal error and will NOT be shown to the user.
 */
export class KnownError extends Error {}

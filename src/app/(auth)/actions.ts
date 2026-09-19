"use server";

import { redirect } from "next/navigation";
import { AuthError as NextAuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/server/services/auth-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

// Only a same-origin relative path is honored — this value can come from a
// URL query param, so it must never be used to redirect off-site.
function safeCallbackUrl(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof NextAuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  redirect(safeCallbackUrl(formData.get("callbackUrl")));
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    redirect("/login");
  }

  redirect("/onboarding/workspace");
}

export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch {
    return {
      error: "Something went wrong sending the reset email. Please try again.",
    };
  }

  // Always report success — never reveal whether the email exists.
  return { success: true };
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  redirect("/login");
}

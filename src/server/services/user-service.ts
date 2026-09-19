import "server-only";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { KnownError } from "@/lib/utils/safe-error-message";

export async function getUserCurrency(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  return user?.currency ?? "INR";
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      timezone: true,
      passwordHash: true,
    },
  });
  if (!user) throw new KnownError("Account not found.");
  return user;
}

export async function updateUserProfile(
  userId: string,
  data: { name: string; currency: string; timezone: string; image?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new KnownError("Account not found.");

  if (!user.passwordHash) {
    throw new KnownError(
      "This account signs in without a password, so there's no password to change."
    );
  }

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new KnownError("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

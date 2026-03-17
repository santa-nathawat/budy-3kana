"use server";

import { prisma } from "@/lib/prisma";
import { Phase } from "@/generated/prisma/browser";

// ─────────────────────────────────────────────
// VERIFY ADMIN PASSWORD
// ─────────────────────────────────────────────
export async function verifyAdminPassword(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return { error: "ADMIN_PASSWORD not configured" };
  if (password !== adminPassword) return { error: "รหัสผ่านไม่ถูกต้อง" };
  return { success: true };
}

// ─────────────────────────────────────────────
// GET ALL ADMIN DATA
// ─────────────────────────────────────────────
export async function getAdminData() {
  const [users, config, logs] = await Promise.all([
    prisma.user.findMany({
      include: {
        chosenBuddy: true,
        chosenByUser: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appConfig.findUnique({ where: { id: "singleton" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Compute stats
  const totalUsers = users.length;
  const engCount = users.filter((u) => u.faculty === "ENGINEERING").length;
  const sciCount = users.filter((u) => u.faculty === "SCIENCE").length;
  const pharmCount = users.filter((u) => u.faculty === "PHARMACY").length;
  const matchedCount = users.filter((u) => u.chosenBuddyId !== null).length;
  const unmatchedCount = users.filter((u) => u.chosenBuddyId === null).length;
  const availableCount = users.filter((u) => !u.isChosen).length;

  const stats = {
    totalUsers,
    engCount,
    sciCount,
    pharmCount,
    matchedCount,
    unmatchedCount,
    availableCount,
  };

  // Map users for the admin table (include password in plaintext area — hash only)
  const usersData = users.map((u) => ({
    id: u.id,
    name: u.name,
    nickname: u.nickname,
    faculty: u.faculty,
    year: u.year,
    department: u.department,
    favFood: u.favFood,
    wishlist: u.wishlist,
    ig: u.ig,
    password: u.password,
    chosenBuddyId: u.chosenBuddyId,
    buddyNickname: u.chosenBuddy?.nickname ?? null,
    buddyFaculty: u.chosenBuddy?.faculty ?? null,
    chosenByUserId: u.chosenByUser?.id ?? null,
    chosenByUserNickname: u.chosenByUser?.nickname ?? null,
    chosenByUserFaculty: u.chosenByUser?.faculty ?? null,
    isChosen: u.isChosen,
  }));

  return {
    stats,
    users: usersData,
    phase: config?.phase ?? "REGISTER",
    logs,
  };
}

// ─────────────────────────────────────────────
// EDIT USER
// ─────────────────────────────────────────────
export async function adminEditUser(formData: FormData) {
  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const nickname = formData.get("nickname") as string;
  const faculty = formData.get("faculty") as string;
  const department = formData.get("department") as string;
  const favFood = formData.get("favFood") as string;
  const wishlist = formData.get("wishlist") as string;
  const ig = formData.get("ig") as string;
  const year = parseInt(formData.get("year") as string);
  const newPassword = formData.get("newPassword") as string;

  if (!userId) return { error: "Missing user ID" };

  const updateData: Record<string, unknown> = {
    name,
    nickname,
    faculty,
    department,
    favFood,
    wishlist,
    year,
    ig,
  };

  if (newPassword && newPassword.trim().length > 0) {
    updateData.password = newPassword;
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "EDIT",
      targetUserId: userId,
      detail: `Edited user: ${name} (${nickname})${newPassword ? " + password reset" : ""}`,
    },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// DELETE USER
// ─────────────────────────────────────────────
export async function adminDeleteUser(userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { chosenBuddy: true, chosenByUser: true },
    });

    if (!user) return { error: "User not found" };

    // 1. If someone picked this user as buddy → clear their chosenBuddyId
    if (user.chosenByUser) {
      await tx.user.update({
        where: { id: user.chosenByUser.id },
        data: { chosenBuddyId: null },
      });
    }

    // 2. If this user picked someone → set that buddy's isChosen to false
    if (user.chosenBuddyId) {
      await tx.user.update({
        where: { id: user.chosenBuddyId },
        data: { isChosen: false },
      });
    }

    // 3. Delete the user
    await tx.user.delete({ where: { id: userId } });

    return { success: true, name: user.name, nickname: user.nickname };
  });

  if (result.success) {
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        targetUserId: userId,
        detail: `Deleted user: ${result.name} (${result.nickname})`,
      },
    });
  }

  return result;
}

// ─────────────────────────────────────────────
// RESET BUDDY
// ─────────────────────────────────────────────
export async function adminResetBuddy(userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (!user.chosenBuddyId) return { error: "User has no buddy to reset" };

    const buddyId = user.chosenBuddyId;

    // Clear this user's buddy
    await tx.user.update({
      where: { id: userId },
      data: { chosenBuddyId: null },
    });

    // Set buddy's isChosen back to false
    await tx.user.update({
      where: { id: buddyId },
      data: { isChosen: false },
    });

    return { success: true, buddyId };
  });

  if (result.success) {
    await prisma.activityLog.create({
      data: {
        action: "RESET_BUDDY",
        targetUserId: userId,
        detail: `Reset buddy: removed link to ${result.buddyId}`,
      },
    });
  }

  return result;
}

// ─────────────────────────────────────────────
// MANUAL MATCH
// ─────────────────────────────────────────────
export async function adminManualMatch(userAId: string, userBId: string) {
  if (userAId === userBId) return { error: "Cannot match a user with themselves" };

  const result = await prisma.$transaction(async (tx) => {
    const userA = await tx.user.findUnique({ where: { id: userAId } });
    const userB = await tx.user.findUnique({ where: { id: userBId } });

    if (!userA || !userB) return { error: "One or both users not found" };
    if (userA.chosenBuddyId) return { error: `${userA.nickname} already has a buddy` };
    if (userB.isChosen) return { error: `${userB.nickname} is already chosen by someone` };

    // Set A → B
    await tx.user.update({
      where: { id: userAId },
      data: { chosenBuddyId: userBId },
    });

    await tx.user.update({
      where: { id: userBId },
      data: { isChosen: true },
    });

    return { success: true };
  });

  if (result.success) {
    await prisma.activityLog.create({
      data: {
        action: "MANUAL_MATCH",
        targetUserId: userAId,
        detail: `Manually matched ${userAId} → ${userBId}`,
      },
    });
  }

  return result;
}

// ─────────────────────────────────────────────
// CHANGE PHASE
// ─────────────────────────────────────────────
export async function adminChangePhase(newPhase: Phase) {
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: { phase: newPhase },
    create: { id: "singleton", phase: newPhase },
  });

  await prisma.activityLog.create({
    data: {
      action: "CHANGE_PHASE",
      targetUserId: "system",
      detail: `Changed phase to ${newPhase}`,
    },
  });

  return { success: true, phase: newPhase };
}

// ─────────────────────────────────────────────
// GET CURRENT PHASE (for user-facing pages)
// ─────────────────────────────────────────────
export async function getCurrentPhase() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });
  return config?.phase ?? "REGISTER";
}

// ─────────────────────────────────────────────
// EXPORT CSV DATA
// ─────────────────────────────────────────────
export async function getExportData() {
  const users = await prisma.user.findMany({
    include: { chosenBuddy: true, chosenByUser: true },
    orderBy: { createdAt: "asc" },
  });

  return users.map((u) => ({
    studentId: u.id,
    name: u.name,
    nickname: u.nickname,
    faculty: u.faculty,
    year: u.year,
    department: u.department,
    favFood: u.favFood,
    wishlist: u.wishlist,
    ig: u.ig,
    buddyNickname: u.chosenBuddy?.nickname ?? "",
    buddyFaculty: u.chosenBuddy?.faculty ?? "",
    chosenByNickname: u.chosenByUser?.nickname ?? "",
    isChosen: u.isChosen ? "Yes" : "No",
  }));
}

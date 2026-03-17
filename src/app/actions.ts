"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { Faculty } from "@/generated/prisma/browser";

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export async function register(formData: FormData) {
  // Check phase — registration only allowed in REGISTER phase
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  const phase = config?.phase ?? "REGISTER";
  if (phase !== "REGISTER") {
    return { error: "ปิดรับสมัครแล้ว" };
  }

  const id = formData.get("studentId") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const nickname = formData.get("nickname") as string;
  const faculty = formData.get("faculty") as Faculty;
  const year = parseInt(formData.get("year") as string);
  const department = formData.get("department") as string;
  const favFood = formData.get("favFood") as string;
  const wishlist = formData.get("wishlist") as string;
  const ig = formData.get("ig") as string;
  const hint = formData.get("hint") as string;

  // Validation
  if (!id || !password || !name || !nickname || !faculty || !year || !department || !favFood || !wishlist || !ig || !hint) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }

  // Validate Student ID format (10 digits)
  if (!/^\d{10}$/.test(id)) {
    return { error: "รหัสนิสิตต้องเป็นตัวเลข 10 หลัก" };
  }

  // Validate faculty enum
  if (!["ENGINEERING", "SCIENCE", "PHARMACY"].includes(faculty)) {
    return { error: "กรุณาเลือกคณะที่ถูกต้อง" };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (existingUser) {
    return { error: "รหัสนิสิตนี้ลงทะเบียนแล้ว" };
  }

  // Create user
  await prisma.user.create({
    data: {
      id,
      password: password,
      name,
      nickname,
      faculty,
      year,
      department,
      favFood,
      wishlist,
      ig,
      hint,
    },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export async function login(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const password = formData.get("password") as string;

  if (!studentId || !password) {
    return { error: "กรุณากรอกรหัสนิสิตและรหัสผ่าน" };
  }

  try {
    await signIn("credentials", {
      studentId,
      password,
      redirectTo: "/",
    });
  } catch (error: unknown) {
    // NextAuth throws a NEXT_REDIRECT "error" on successful redirect
    // We need to re-throw it so Next.js handles the redirect
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    // Check for the redirect digest pattern used by Next.js
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as Record<string, unknown>).digest === "string" &&
      ((error as Record<string, unknown>).digest as string).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return { error: "รหัสนิสิตหรือรหัสผ่านไม่ถูกต้อง" };
  }
}

// ─────────────────────────────────────────────
// MATCH BUDDY (CRITICAL ALGORITHM)
// ─────────────────────────────────────────────
export async function findBuddy(userId: string) {
  // Check phase — matching only allowed in RANDOM phase
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  const phase = config?.phase ?? "REGISTER";
  if (phase !== "RANDOM") {
    return { error: "ยังไม่เปิดให้จับคู่บัดดี้ในตอนนี้" };
  }

  // Use a Prisma transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch the current user
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return { error: "ไม่พบผู้ใช้" };
    }

    // 2. Check if user already has a buddy
    if (currentUser.chosenBuddyId) {
      return { error: "คุณจับคู่บัดดี้ไปแล้ว!" };
    }

    // 3. Find candidates: not chosen by anyone, not self
    //    PRIORITY: Different faculty first (Cross-Faculty matching)
    const crossFacultyCandidates = await tx.user.findMany({
      where: {
        isChosen: false,
        id: { not: userId },
        faculty: { not: currentUser.faculty },
      },
    });

    let chosenBuddy;

    if (crossFacultyCandidates.length > 0) {
      // Pick randomly from cross-faculty candidates
      const randomIndex = Math.floor(Math.random() * crossFacultyCandidates.length);
      chosenBuddy = crossFacultyCandidates[randomIndex];
    } else {
      // FALLBACK: Same faculty (only if no cross-faculty exists)
      const sameFacultyCandidates = await tx.user.findMany({
        where: {
          isChosen: false,
          id: { not: userId },
        },
      });

      if (sameFacultyCandidates.length === 0) {
        return { error: "ไม่มีบัดดี้ที่ว่างอยู่แล้ว 😢 ลองใหม่ทีหลังนะ" };
      }

      const randomIndex = Math.floor(Math.random() * sameFacultyCandidates.length);
      chosenBuddy = sameFacultyCandidates[randomIndex];
    }

    // 4. Perform the match atomically:
    //    - Set chosenBuddyId on current user
    //    - Set isChosen = true on the buddy
    await tx.user.update({
      where: { id: userId },
      data: { chosenBuddyId: chosenBuddy.id },
    });

    await tx.user.update({
      where: { id: chosenBuddy.id },
      data: { isChosen: true },
    });

    // 5. Return buddy info (safe fields only — NO student ID, NO full name)
    return {
      success: true,
      buddy: {
        nickname: chosenBuddy.nickname,
        faculty: chosenBuddy.faculty,
        year: chosenBuddy.year,
        department: chosenBuddy.department,
        favFood: chosenBuddy.favFood,
        wishlist: chosenBuddy.wishlist,
        ig: chosenBuddy.ig,
        hint: chosenBuddy.hint,
      },
    };
  });

  return result;
}

// ─────────────────────────────────────────────
// GET BUDDY INFO (for already matched users)
// ─────────────────────────────────────────────
export async function getBuddyInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { chosenBuddy: true },
  });

  if (!user || !user.chosenBuddy) {
    return null;
  }

  // Return safe fields only
  return {
    nickname: user.chosenBuddy.nickname,
    faculty: user.chosenBuddy.faculty,
    year: user.chosenBuddy.year,
    department: user.chosenBuddy.department,
    favFood: user.chosenBuddy.favFood,
    wishlist: user.chosenBuddy.wishlist,
    ig: user.chosenBuddy.ig,
    hint: user.chosenBuddy.hint,
  };
}

// ─────────────────────────────────────────────
// GET BUDDER INFO (who picked this user)
// ─────────────────────────────────────────────
export async function getBudderInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { chosenByUser: true },
  });

  if (!user || !user.chosenByUser) {
    return null;
  }

  // Return safe fields only
  return {
    nickname: user.chosenByUser.nickname,
    faculty: user.chosenByUser.faculty,
    year: user.chosenByUser.year,
    department: user.chosenByUser.department,
    favFood: user.chosenByUser.favFood,
    wishlist: user.chosenByUser.wishlist,
    ig: user.chosenByUser.ig,
    hint: user.chosenByUser.hint,
  };
}

// ─────────────────────────────────────────────
// GET CURRENT PHASE (for pages)
// ─────────────────────────────────────────────
export async function getCurrentPhase() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });
  return config?.phase ?? "REGISTER";
}

import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getBuddyInfo, getBudderInfo, getCurrentPhase } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import GameInterface from "@/components/GameInterface";

export const dynamic = "force-dynamic"; // No caching — phase changes propagate immediately

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get full user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect("/login");
  }

  // Check if already matched
  const existingBuddy = await getBuddyInfo(userId);
  const existingBudder = await getBudderInfo(userId);

  // Get current phase
  const phase = await getCurrentPhase();

  return (
    <div className="relative">
      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="minimal-btn border border-input bg-white text-foreground text-xs px-4 py-2 hover:bg-gray-50"
          >
            Log out
          </button>
        </form>
      </div>

      <GameInterface
        userId={userId}
        userFaculty={user.faculty}
        userNickname={user.nickname}
        existingBuddy={existingBuddy}
        existingBudder={existingBudder}
        phase={phase}
      />
    </div>
  );
}

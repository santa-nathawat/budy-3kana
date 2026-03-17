"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { findBuddy } from "@/app/actions";
import { getFacultyConfig } from "@/lib/faculty";

type BuddyInfo = {
  nickname: string;
  faculty: string;
  year: number;
  department: string;
  favFood: string;
  wishlist: string;
  ig: string;
  hint?: string;
};

type GameInterfaceProps = {
  userId: string;
  userFaculty: string;
  userNickname: string;
  existingBuddy: BuddyInfo | null;
  existingBudder: BuddyInfo | null;
  phase: string; // "REGISTER" | "RANDOM" | "REVEAL"
};

type GamePhase = "idle" | "searching" | "revealing" | "revealed";

export default function GameInterface({
  userId,
  userFaculty,
  userNickname,
  existingBuddy,
  existingBudder,
  phase,
}: GameInterfaceProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>(
    existingBuddy ? "revealed" : "idle"
  );
  const [buddy, setBuddy] = useState<BuddyInfo | null>(existingBuddy);
  const [showBudder, setShowBudder] = useState(false);
  const [error, setError] = useState("");

  const facultyConfig = getFacultyConfig(userFaculty);

  const handleFindBuddy = useCallback(async () => {
    setError("");
    setGamePhase("searching");

    // Suspense animation for 2 seconds (minimalist wait)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await findBuddy(userId);

    if (result?.error) {
      setError(result.error);
      setGamePhase("idle");
      return;
    }

    if (result && 'buddy' in result && result.buddy) {
      setBuddy(result.buddy as BuddyInfo);
      setGamePhase("revealing");

      // Brief pause before final reveal
      setTimeout(() => {
        setGamePhase("revealed");
      }, 1000);
    }
  }, [userId]);

  // Determine what to show based on app phase + user state
  const canMatch = phase === "RANDOM" && !existingBuddy;
  const isWaitingPhase = phase === "REGISTER" && !existingBuddy;
  const isRevealPhase = phase === "REVEAL";
  const isRevealNoMatch = isRevealPhase && !existingBuddy;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden bg-background">
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold mb-1 text-foreground tracking-tight">
          สานสัมพันธ์ 3 คณะ
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Buddy Matching Game
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-eng)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-sci)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-faculty-pharm)]" />
        </div>
      </motion.div>

      {/* User badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-input rounded-full px-5 py-1.5 mb-8 font-medium text-sm text-foreground bg-white shadow-sm"
      >
        <span className="mr-2" style={{ color: facultyConfig.textColor }}>●</span> 
        {userNickname} — {facultyConfig.shortName}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-red-200 bg-red-50 text-red-700 px-5 py-3 rounded-md mb-6 font-medium text-sm max-w-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REGISTER PHASE: Waiting message ─── */}
      {isWaitingPhase && gamePhase === "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="minimal-card px-8 py-8 max-w-sm mx-auto">
            <h2 className="text-lg font-medium mb-2 text-foreground">
              Waiting for Match Phase
            </h2>
            <p className="text-sm text-muted-foreground">
              Registration is currently open. Matching will be available soon.
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── REVEAL PHASE: No match message (if applicable) ─── */}
      {isRevealNoMatch && gamePhase === "idle" && !showBudder && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="minimal-card px-8 py-8 max-w-sm mx-auto">
            <h2 className="text-lg font-medium mb-2 text-foreground">
              No Buddy Assigned
            </h2>
            <p className="text-sm text-muted-foreground">
              Unfortunately, no match was found for you this time.
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── REVEAL Toggle Button ─── */}
      {isRevealPhase && (existingBuddy || existingBudder) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 z-10"
        >
          <button
            onClick={() => setShowBudder(!showBudder)}
            className="minimal-btn bg-white border border-input text-foreground px-6 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            {showBudder ? "Return to Buddy" : "View Budder (Who drew me?)"}
          </button>
        </motion.div>
      )}

      {/* ─── RANDOM PHASE (or already matched): Game Content ─── */}
      <AnimatePresence mode="wait">
        {/* IDLE — Show the big "Find Buddy" button */}
        {canMatch && gamePhase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <motion.button
              onClick={handleFindBuddy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="minimal-btn text-white text-lg px-8 py-4 font-medium shadow-sm"
              style={{ backgroundColor: facultyConfig.color }}
            >
              Find My Buddy
            </motion.button>
            <p className="text-xs text-muted-foreground mt-4 font-medium">
              Click to match cross-faculty!
            </p>
          </motion.div>
        )}

        {/* SEARCHING — Minimalist loading */}
        {gamePhase === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="flex gap-4 mb-8 h-8 items-center">
              <motion.div
                className="w-3 h-3 rounded-full bg-[var(--color-faculty-eng)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="w-3 h-3 rounded-full bg-[var(--color-faculty-sci)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.div
                className="w-3 h-3 rounded-full bg-[var(--color-faculty-pharm)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              Finding a match...
            </p>
          </motion.div>
        )}

        {/* REVEALING — Quick typography flash */}
        {gamePhase === "revealing" && buddy && (
          <motion.div
            key="revealing"
            initial={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-2xl font-light text-foreground tracking-widest uppercase">Match Found</p>
          </motion.div>
        )}

        {/* REVEALED — Minimal Cards */}
        {gamePhase === "revealed" && (
          <motion.div key="revealed" className="w-full flex justify-center">
            {showBudder ? (
              existingBudder ? (
                <BuddyCard
                  buddy={existingBudder}
                  isNew={false}
                  title="Your Budder"
                  subtitle="This is the person who drew you."
                />
              ) : (
                <div className="minimal-card px-8 py-8 max-w-sm mx-auto text-center">
                  <h2 className="text-lg font-medium mb-1 text-foreground">No Budder Yet</h2>
                  <p className="text-sm text-muted-foreground">Nobody has drawn you yet.</p>
                </div>
              )
            ) : (
              buddy && <BuddyCard
                buddy={buddy}
                isNew={!existingBuddy}
                title={!existingBuddy ? "Match Acquired" : "Your Buddy"}
                subtitle="Get to know your buddy! ✨"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Buddy Reveal Card
// ─────────────────────────────────────────────
function BuddyCard({
  buddy,
  isNew,
  title,
  subtitle
}: {
  buddy: BuddyInfo;
  isNew: boolean;
  title: string;
  subtitle: string;
}) {
  const buddyFaculty = getFacultyConfig(buddy.faculty);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isNew ? { duration: 0.5, ease: "easeOut" } : {}}
      className="w-full max-w-sm"
    >
      <motion.div
        className="text-center mb-4"
        initial={isNew ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ delay: isNew ? 0.2 : 0 }}
      >
        <h2 className="text-xl font-medium tracking-tight text-foreground">
          {title}
        </h2>
      </motion.div>

      <motion.div
        className="minimal-card overflow-hidden bg-white"
        initial={isNew ? { opacity: 0, scale: 0.95 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: isNew ? 0.3 : 0 }}
      >
        <div
          className="py-8 px-6 text-center border-b border-input"
          style={{ backgroundColor: buddyFaculty.bgClass === "bg-red-50" ? "var(--color-faculty-eng)" : buddyFaculty.bgClass === "bg-yellow-50" ? "var(--color-faculty-sci)" : "var(--color-faculty-pharm)" }}
        >
          <motion.p
            className="text-3xl font-medium tracking-tight"
            style={{ color: buddyFaculty.textColor }}
            initial={isNew ? { y: 10, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            transition={isNew ? { duration: 0.5, delay: 0.5 } : {}}
          >
            {buddy.nickname}
          </motion.p>
          <span
            className="inline-block mt-3 px-3 py-1 bg-white/60 rounded-full text-xs font-medium"
            style={{ color: buddyFaculty.textColor }}
          >
            {buddyFaculty.name}
          </span>
        </div>
        {/* Info Grid */}
        <div className="p-6 space-y-4">
          <InfoRow label="Year" value={`Year ${buddy.year}`} delay={isNew ? 0.6 : 0} />
          <InfoRow label="Department" value={buddy.department} delay={isNew ? 0.65 : 0} />
          <InfoRow label="Favorite Food" value={buddy.favFood} delay={isNew ? 0.7 : 0} />
          <InfoRow label="Wishlist" value={buddy.wishlist} delay={isNew ? 0.75 : 0} />
          {buddy.hint && (
            <InfoRow label="Hint (คำใบ้)" value={buddy.hint} delay={isNew ? 0.8 : 0} />
          )}
          <InfoRow label="Instagram" value={buddy.ig} delay={isNew ? 0.85 : 0} isIG />
        </div>
      </motion.div>

      <motion.p
        className="text-center text-xs text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: isNew ? 1.0 : 0 }}
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  delay,
  isIG,
}: {
  label: string;
  value: string;
  delay: number;
  isIG?: boolean;
}) {
  return (
    <motion.div
      initial={delay > 0 ? { opacity: 0, y: 5 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-1 py-1"
    >
      <p className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
        {label}
      </p>
      {isIG ? (
        <a
          href={`https://instagram.com/${value.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline hover:text-blue-800 text-sm transition-colors"
        >
          {value}
        </a>
      ) : (
        <p className="font-medium text-foreground text-sm">{value}</p>
      )}
    </motion.div>
  );
}

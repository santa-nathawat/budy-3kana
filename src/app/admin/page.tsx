"use client";

import { useState, useEffect, useCallback } from "react";
import {
  verifyAdminPassword,
  getAdminData,
  adminEditUser,
  adminDeleteUser,
  adminResetBuddy,
  adminManualMatch,
  adminChangePhase,
  getExportData,
} from "./actions";

// ─── Types ───
type UserRow = {
  id: string;
  name: string;
  nickname: string;
  faculty: string;
  year: number;
  department: string;
  favFood: string;
  wishlist: string;
  ig: string;
  password: string;
  chosenBuddyId: string | null;
  buddyNickname: string | null;
  buddyFaculty: string | null;
  chosenByUserId: string | null;
  chosenByUserNickname: string | null;
  chosenByUserFaculty: string | null;
  isChosen: boolean;
};

type Stats = {
  totalUsers: number;
  engCount: number;
  sciCount: number;
  pharmCount: number;
  matchedCount: number;
  unmatchedCount: number;
  availableCount: number;
};

type LogEntry = {
  id: string;
  action: string;
  targetUserId: string;
  detail: string;
  createdAt: Date;
};

const FACULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ENGINEERING: { bg: "var(--color-faculty-eng)", text: "var(--color-faculty-eng-text)", label: "🔴 วิศวะ" },
  SCIENCE: { bg: "var(--color-faculty-sci)", text: "var(--color-faculty-sci-text)", label: "🟡 วิทย์" },
  PHARMACY: { bg: "var(--color-faculty-pharm)", text: "var(--color-faculty-pharm-text)", label: "🟢 เภสัช" },
};

const PHASE_CONFIG: Record<string, { label: string; color: string; text: string }> = {
  REGISTER: { label: "📝 REGISTER", color: "var(--color-faculty-sci)", text: "var(--color-faculty-sci-text)" },
  RANDOM: { label: "🎲 RANDOM", color: "var(--color-faculty-eng)", text: "var(--color-faculty-eng-text)" },
  REVEAL: { label: "🎉 REVEAL", color: "var(--color-faculty-pharm)", text: "var(--color-faculty-pharm-text)" },
};

// ─── Faculty Badge ───
function FacultyBadge({ faculty }: { faculty: string }) {
  const config = FACULTY_COLORS[faculty];
  if (!config) return <span>{faculty}</span>;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

// ═══════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═══════════════════════════════════════════════
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    const result = await verifyAdminPassword(password);
    if (result.error) {
      setAuthError(result.error);
    } else {
      sessionStorage.setItem("admin_auth", "true");
      setAuthenticated(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="minimal-card p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4 text-center">🔒 Admin Login</h1>
          {authError && (
            <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{authError}</p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin Password"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
          />
          <button
            onClick={handleLogin}
            className="w-full minimal-btn bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ═══════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════
function AdminDashboard() {
  const [data, setData] = useState<{
    stats: Stats;
    users: UserRow[];
    phase: string;
    logs: LogEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [showManualMatch, setShowManualMatch] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getAdminData();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const filteredUsers = data.users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.id.includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.nickname.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.ig.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">⚙️ Admin Dashboard</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              window.location.reload();
            }}
            className="text-xs text-muted-foreground hover:text-red-600 border border-input rounded px-3 py-1 minimal-btn"
          >
            Logout
          </button>
        </div>

        {/* Phase Control */}
        <PhaseControl
          currentPhase={data.phase}
          onPhaseChange={async (phase) => {
            await adminChangePhase(phase as "REGISTER" | "RANDOM" | "REVEAL");
            loadData();
          }}
        />

        {/* Stats */}
        <StatsPanel stats={data.stats} />

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 ค้นหา (ID, ชื่อ, ชื่อเล่น, ฝ่าย, IG)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-input rounded px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={() => setShowManualMatch(true)}
            className="minimal-btn bg-primary text-primary-foreground text-sm px-4 py-2 font-medium"
          >
            🔗 Manual Match
          </button>
          <button
            onClick={async () => {
              const rows = await getExportData();
              if (!rows.length) return alert("No data to export");
              const headers = Object.keys(rows[0]);
              const csvContent = [
                headers.join(","),
                ...rows.map((r) =>
                  headers.map((h) => `"${String((r as Record<string, unknown>)[h]).replace(/"/g, '""')}"`).join(",")
                ),
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `buddy3kana_export_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="minimal-btn border border-input text-foreground text-sm px-4 py-2 font-medium bg-white hover:bg-gray-50"
          >
            📥 Export CSV
          </button>
        </div>

        {/* User Table */}
        <UserTable
          users={filteredUsers}
          onEdit={(user) => setEditingUser(user)}
          onDelete={async (userId) => {
            if (!confirm(`ยืนยันลบผู้ใช้ ${userId}?`)) return;
            const result = await adminDeleteUser(userId);
            if (result.error) alert(result.error);
            loadData();
          }}
          onResetBuddy={async (userId) => {
            if (!confirm(`ยืนยัน Reset Buddy ของ ${userId}?`)) return;
            const result = await adminResetBuddy(userId);
            if (result.error) alert(result.error);
            loadData();
          }}
        />

        {/* Edit Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={async (formData) => {
              const result = await adminEditUser(formData);
              if (result.error) alert(result.error);
              setEditingUser(null);
              loadData();
            }}
          />
        )}

        {/* Manual Match Modal */}
        {showManualMatch && (
          <ManualMatchModal
            users={data.users}
            onClose={() => setShowManualMatch(false)}
            onMatch={async (a, b) => {
              const result = await adminManualMatch(a, b);
              if (result.error) {
                alert(result.error);
                return;
              }
              setShowManualMatch(false);
              loadData();
            }}
          />
        )}

        {/* Activity Log */}
        <ActivityLogTable logs={data.logs} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PHASE CONTROL
// ═══════════════════════════════════════════════
function PhaseControl({
  currentPhase,
  onPhaseChange,
}: {
  currentPhase: string;
  onPhaseChange: (phase: string) => void;
}) {
  return (
    <div className="minimal-card p-4 bg-white">
      <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
        🎛 Phase Control
      </h2>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-600 mr-2">Current:</span>
        <span
          className="px-3 py-1 rounded-full text-sm font-bold shadow-sm"
          style={{ 
            backgroundColor: PHASE_CONFIG[currentPhase]?.color ?? "#666",
            color: PHASE_CONFIG[currentPhase]?.text ?? "#fff"
          }}
        >
          {PHASE_CONFIG[currentPhase]?.label ?? currentPhase}
        </span>
        <span className="text-gray-300">|</span>
        {["REGISTER", "RANDOM", "REVEAL"].map((phase) => (
          <button
            key={phase}
            onClick={() => {
              if (phase === currentPhase) return;
              if (confirm(`เปลี่ยน phase เป็น ${phase}?`)) {
                onPhaseChange(phase);
              }
            }}
            disabled={phase === currentPhase}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              phase === currentPhase
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            {PHASE_CONFIG[phase]?.label ?? phase}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// STATS PANEL
// ═══════════════════════════════════════════════
function StatsPanel({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "var(--foreground)" },
    { label: "🔴 วิศวะ", value: stats.engCount, color: "var(--foreground)" },
    { label: "🟡 วิทย์", value: stats.sciCount, color: "var(--foreground)" },
    { label: "🟢 เภสัช", value: stats.pharmCount, color: "var(--foreground)" },
    { label: "✅ Matched", value: stats.matchedCount, color: "var(--foreground)" },
    { label: "⏳ Unmatched", value: stats.unmatchedCount, color: "var(--foreground)" },
    { label: "🎯 Available", value: stats.availableCount, color: "var(--foreground)" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="minimal-card p-3 text-center bg-white"
        >
          <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// USER TABLE
// ═══════════════════════════════════════════════
function UserTable({
  users,
  onEdit,
  onDelete,
  onResetBuddy,
}: {
  users: UserRow[];
  onEdit: (user: UserRow) => void;
  onDelete: (userId: string) => void;
  onResetBuddy: (userId: string) => void;
}) {
  return (
    <div className="minimal-card overflow-x-auto bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-input bg-accent/20">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">ID</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Name</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Nickname</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Faculty</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Year</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Dept</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Food</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Wishlist</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">IG</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Password</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Buddy</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Buddee</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-input hover:bg-accent/30 transition-colors">
              <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
              <td className="px-3 py-2 whitespace-nowrap">{u.name}</td>
              <td className="px-3 py-2 font-bold">{u.nickname}</td>
              <td className="px-3 py-2">
                <FacultyBadge faculty={u.faculty} />
              </td>
              <td className="px-3 py-2">{u.year}</td>
              <td className="px-3 py-2">{u.department}</td>
              <td className="px-3 py-2">{u.favFood}</td>
              <td className="px-3 py-2">{u.wishlist}</td>
              <td className="px-3 py-2 text-xs">{u.ig}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {u.password}
              </td>
              <td className="px-3 py-2">
                {u.buddyNickname ? (
                  <span className="flex items-center gap-1">
                    <span className="font-bold">{u.buddyNickname}</span>
                    <FacultyBadge faculty={u.buddyFaculty!} />
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">ยังไม่ได้ match</span>
                )}
              </td>
              <td className="px-3 py-2">
                {u.chosenByUserNickname ? (
                  <span className="flex items-center gap-1">
                    <span className="font-bold">{u.chosenByUserNickname}</span>
                    <FacultyBadge faculty={u.chosenByUserFaculty!} />
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(u)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(u.id)}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                  >
                    🗑️
                  </button>
                  {u.chosenBuddyId && (
                    <button
                      onClick={() => onResetBuddy(u.id)}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200"
                    >
                      🔄
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={12} className="text-center py-8 text-gray-400">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════
// EDIT USER MODAL
// ═══════════════════════════════════════════════
function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: UserRow;
  onClose: () => void;
  onSave: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="minimal-card bg-white w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">✏️ Edit User: {user.nickname}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("userId", user.id);
            onSave(fd);
          }}
          className="space-y-3"
        >
          <FieldInput label="Name" name="name" defaultValue={user.name} />
          <FieldInput label="Nickname" name="nickname" defaultValue={user.nickname} />
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Faculty</label>
            <select
              name="faculty"
              defaultValue={user.faculty}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="ENGINEERING">🔴 Engineering</option>
              <option value="SCIENCE">🟡 Science</option>
              <option value="PHARMACY">🟢 Pharmacy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
            <select
              name="year"
              defaultValue={user.year}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="1">ปี 1</option>
              <option value="2">ปี 2</option>
              <option value="3">ปี 3</option>
              <option value="4">ปี 4</option>
              <option value="5">ปี 5+</option>
            </select>
          </div>
          <FieldInput label="Department" name="department" defaultValue={user.department} />
          <FieldInput label="Fav Food" name="favFood" defaultValue={user.favFood} />
          <FieldInput label="Wishlist" name="wishlist" defaultValue={user.wishlist} />
          <FieldInput label="IG" name="ig" defaultValue={user.ig} />
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Reset Password <span className="text-gray-400">(leave blank to keep)</span>
            </label>
            <input
              name="newPassword"
              type="text"
              placeholder="New password (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 minimal-btn bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 minimal-btn border border-input text-foreground px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// MANUAL MATCH MODAL
// ═══════════════════════════════════════════════
function ManualMatchModal({
  users,
  onClose,
  onMatch,
}: {
  users: UserRow[];
  onClose: () => void;
  onMatch: (userAId: string, userBId: string) => void;
}) {
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");

  // Candidates for User A: users who don't have a buddy yet
  const candidatesA = users.filter((u) => !u.chosenBuddyId);
  // Candidates for User B: users who haven't been chosen yet
  const candidatesB = users.filter((u) => !u.isChosen && u.id !== userA);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="minimal-card w-full max-w-md p-6 bg-white">
        <h2 className="text-lg font-bold mb-4">🔗 Manual Match</h2>
        <p className="text-xs text-gray-500 mb-4">
          User A จะถูก set ให้ chosenBuddyId = User B, User B จะถูก set isChosen = true
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              User A (ผู้เลือกบัดดี้)
            </label>
            <select
              value={userA}
              onChange={(e) => setUserA(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">-- Select User A --</option>
              {candidatesA.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nickname} ({u.id}) — {FACULTY_COLORS[u.faculty]?.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center text-gray-400 text-lg">→</div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              User B (ถูกเลือกเป็นบัดดี้)
            </label>
            <select
              value={userB}
              onChange={(e) => setUserB(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">-- Select User B --</option>
              {candidatesB.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nickname} ({u.id}) — {FACULTY_COLORS[u.faculty]?.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={() => {
              if (!userA || !userB) return alert("กรุณาเลือกทั้ง User A และ User B");
              if (!confirm(`Match: ${userA} → ${userB}?`)) return;
              onMatch(userA, userB);
            }}
            className="flex-1 minimal-btn bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            🔗 Match
          </button>
          <button
            onClick={onClose}
            className="flex-1 minimal-btn border border-input text-foreground px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ACTIVITY LOG TABLE
// ═══════════════════════════════════════════════
function ActivityLogTable({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) return null;

  return (
    <div className="minimal-card bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
          📋 Activity Log (Last 50)
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-input bg-accent/20">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Time</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Action</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Target</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100">
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("th-TH")}
                </td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{log.targetUserId}</td>
                <td className="px-3 py-2 text-xs">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

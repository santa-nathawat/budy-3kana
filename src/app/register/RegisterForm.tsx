"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { register } from "@/app/actions";

const faculties = [
  { value: "ENGINEERING", label: "วิศวกรรมศาสตร์", color: "var(--color-faculty-eng)", text: "var(--color-faculty-eng-text)" },
  { value: "SCIENCE", label: "วิทยาศาสตร์", color: "var(--color-faculty-sci)", text: "var(--color-faculty-sci-text)" },
  { value: "PHARMACY", label: "เภสัชศาสตร์", color: "var(--color-faculty-pharm)", text: "var(--color-faculty-pharm-text)" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  };

  const getFacultyStyle = () => {
    const f = faculties.find((f) => f.value === selectedFaculty);
    if (!f) return { borderColor: "var(--border)" };
    return { borderColor: f.color };
  };

  const getFacultyButtonStyle = () => {
    const f = faculties.find((f) => f.value === selectedFaculty);
    if (!f) return { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" };
    return { backgroundColor: f.color, color: f.text };
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div
          className="minimal-card p-6 sm:p-8"
          style={getFacultyStyle()}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-1 text-foreground">
              Register
            </h1>
            <p className="text-sm text-muted-foreground">
              ค่ายสามสัญจร สอนสัมพันธ์ ครั้งที่ 2
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6 text-sm border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Student ID
              </label>
              <input
                name="studentId"
                type="text"
                maxLength={10}
                pattern="\d{10}"
                required
                placeholder="6xxxxxxxxx"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={4}
                placeholder="password"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Faculty Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                  Faculty
                </label>
                <select
                  name="faculty"
                  required
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
                >
                  <option value="">Select</option>
                  {faculties.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                  Year
                </label>
                <select
                  name="year"
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="First Last"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nickname */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                  Nickname
                </label>
                <input
                  name="nickname"
                  type="text"
                  required
                  placeholder="Nickname"
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                  Department
                </label>
                <select
                  name="department"
                  required
                  defaultValue=""
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white text-foreground"
                >
                  <option value="" disabled hidden>Select Department</option>
                  <option value="ประธานโครงการ">ประธานโครงการ</option>
                  <option value="เลขานุการ">เลขานุการ</option>
                  <option value="ที่ปรึกษาโครงการ">ที่ปรึกษาโครงการ</option>
                  <option value="เหรัญญิก">เหรัญญิก</option>
                  <option value="ฝ่ายสปอนเซอร์">ฝ่ายสปอนเซอร์</option>
                  <option value="ประธานอำนวยการ 1">ประธานอำนวยการ 1</option>
                  <option value="ประธานอำนวยการ 2">ประธานอำนวยการ 2</option>
                  <option value="ประธานเนื้อหา">ประธานเนื้อหา</option>
                  <option value="ประธานวิชาการ">ประธานวิชาการ</option>
                  <option value="ฝ่ายสวัสดิการ">ฝ่ายสวัสดิการ</option>
                  <option value="ฝ่ายพยาบาล">ฝ่ายพยาบาล</option>
                  <option value="ฝ่ายทะเบียนบัตร">ฝ่ายทะเบียนบัตร</option>
                  <option value="ฝ่ายพัสดุ">ฝ่ายพัสดุ</option>
                  <option value="ฝ่ายสถานที่และกายภาพ">ฝ่ายสถานที่และกายภาพ</option>
                  <option value="ฝ่ายพี่กลุ่ม">ฝ่ายพี่กลุ่ม</option>
                  <option value="ฝ่ายสานสัมพันธ์">ฝ่ายสานสัมพันธ์</option>
                  <option value="ฝ่ายกิจและพิธีการ">ฝ่ายกิจและพิธีการ</option>
                  <option value="ฝ่าย PR & Photo">ฝ่าย PR & Photo</option>
                  <option value="ฝ่ายวิชาการวิศวะ">ฝ่ายวิชาการวิศวะ</option>
                  <option value="ฝ่ายวิชาการวิทยา">ฝ่ายวิชาการวิทยา</option>
                  <option value="ฝ่ายวิชาการเภสัช">ฝ่ายวิชาการเภสัช</option>
                </select>
              </div>
            </div>

            {/* Fav Food */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Favorite Food
              </label>
              <input
                name="favFood"
                type="text"
                required
                placeholder="What do you like to eat?"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* Wishlist */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Wishlist
              </label>
              <input
                name="wishlist"
                type="text"
                required
                placeholder="What would you like to get?"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* Hint (คำใบ้) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Hint (คำใบ้)
              </label>
              <input
                name="hint"
                type="text"
                required
                placeholder="คำใบ้ให้ buddy ทาย"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            {/* IG */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground tracking-wide uppercase">
                Instagram
              </label>
              <input
                name="ig"
                type="text"
                required
                placeholder="@username"
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:border-ring transition-colors bg-white"
              />
            </div>

            <div className="pt-2">
              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full minimal-btn py-2.5 text-sm disabled:opacity-50 mt-4 flex items-center justify-center"
                style={getFacultyButtonStyle()}
              >
                {loading ? "Registering..." : "Submit"}
              </button>
            </div>
          </form>

          {/* Login link */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Student ID",
      credentials: {
        studentId: { label: "Student ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const studentId = credentials?.studentId as string;
        const password = credentials?.password as string;

        if (!studentId || !password) return null;

        const user = await prisma.user.findUnique({
          where: { id: studentId },
        });

        if (!user) return null;

        const isValid = user.password === password;
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.faculty, // We repurpose the email field to carry faculty info
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.faculty = user.email; // faculty stored in email field
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.faculty = token.faculty as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

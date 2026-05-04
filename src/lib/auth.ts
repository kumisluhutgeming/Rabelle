import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Email atau Username", type: "text", placeholder: "Email / Username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const isEmail = credentials.login.includes("@");

        const user = await prisma.users.findFirst({
          where: isEmail ? { email: credentials.login } : { username: credentials.login }
        });

        if (!user) {
          throw new Error("User tidak ditemukan");
        }

        // bcryptjs handles bcrypt hashes from laravel perfectly
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // Return object mapping to NextAuth user
        return {
          id: user.id.toString(), // Prisma BigInt to string
          name: user.name,
          email: user.email,
          username: user.username,
          isAdmin: user.is_admin,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Custom login page
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
};

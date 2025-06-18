import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // This would typically check against your database
        // For now, we'll use a simple check
        if (credentials.email === "demo@mindfulai.com" && credentials.password === "demo123") {
          return {
            id: "demo-user",
            email: credentials.email,
            name: "Demo User",
            image: null,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && user) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId || user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.provider = token.provider as string;
        session.user.providerId = token.providerId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
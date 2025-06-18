import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

        try {
          // Check if user exists in Convex
          const existingUser = await convex.query(api.users.getUserByEmail, {
            email: credentials.email,
          });

          // For demo purposes, allow demo credentials
          if (
            credentials.email === "demo@mindfulai.com" &&
            credentials.password === "demo123"
          ) {
            if (!existingUser) {
              // Create demo user in Convex
              const userId = await convex.mutation(api.users.createUser, {
                email: credentials.email,
                name: "Demo User",
                provider: "credentials",
                providerId: "demo-user",
              });

              return {
                id: userId,
                email: credentials.email,
                name: "Demo User",
                image: null,
              };
            }

            return {
              id: existingUser._id,
              email: existingUser.email,
              name: existingUser.name || "Demo User",
              image: existingUser.image || null,
            };
          }

          // Verify password for non-demo users
          if (!existingUser || !existingUser.hashedPassword) {
            return null; // User not found or no password set
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            existingUser.hashedPassword
          );

          if (!passwordMatch) {
            return null; // Passwords do not match
          }

          return {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name || null,
            image: existingUser.image || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    // Uncomment when ready to use OAuth
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // GitHubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Create or update user in Convex for OAuth providers
          await convex.mutation(api.auth.createOrUpdateUser, {
            email: user.email!,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            provider: account.provider,
            providerId: account.providerAccountId!,
          });
        } catch (error) {
          console.error("Error creating/updating user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
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

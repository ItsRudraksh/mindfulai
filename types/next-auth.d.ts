import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      provider?: string;
      providerId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    provider?: string;
    providerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    providerId?: string;
  }
}
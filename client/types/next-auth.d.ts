import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      companyName?: string;
      role?: string;
      plan?: string;
    }
  }

  interface User {
    id: string;
    accessToken?: string;
    companyName?: string;
    role?: string;
    plan?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    companyName?: string;
    role?: string;
    plan?: string;
  }
}

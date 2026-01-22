import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

type BackendLoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    companyName?: string;
    role?: string;
    plan?: string;
  };
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";
          const res = await axios.post<BackendLoginResponse>(`${apiBaseUrl}/api/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });

          const user = res.data.user;
          const token = res.data.token;

          if (user && token) {
            return { ...user, accessToken: token };
          }
          return null;
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            const message = (error.response?.data as { message?: unknown } | undefined)?.message;
            if (typeof message === "string" && message.length > 0) {
              throw new Error(message);
            }
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.companyName = user.companyName;
        token.role = user.role;
        token.plan = user.plan;
      }
      
      if (trigger === "update" && session?.plan) {
        token.plan = session.plan;
      }
      
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id || "";
      session.user.companyName = token.companyName;
      session.user.role = token.role;
      session.user.plan = token.plan;
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

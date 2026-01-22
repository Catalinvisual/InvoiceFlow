"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}


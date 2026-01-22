"use client";

import { useForm } from "react-hook-form";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "Email not verified") {
        setError("Please verify your email address before logging in.");
      } else {
        setError("Invalid email or password");
      }
    } else {
      const session = await getSession();
      if (session?.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-sm text-gray-900">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

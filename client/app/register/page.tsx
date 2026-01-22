"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useState, type FormEvent, useRef, type KeyboardEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

type RegisterFormData = {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function RegisterForm() {
  const { register, handleSubmit, watch, reset } = useForm<RegisterFormData>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [savedData, setSavedData] = useState<RegisterFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newDigits = [...codeDigits];
    // Handle paste or single char
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newDigits[index + i] = pasted[i];
      }
      setCodeDigits(newDigits);
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(index + value.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newDigits[index] = value;
      setCodeDigits(newDigits);
      // Auto-advance
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setInfo("");

      const selectedPlan = plan ? plan.toUpperCase() : 'FREE';

      await axios.post("http://localhost:5000/api/auth/register", {
        companyName: data.companyName,
        email: data.email,
        password: data.password,
        plan: selectedPlan,
      });

      setSavedData(data);
      setPendingEmail(data.email);
      setPendingPassword(data.password);
      setStep("verify");
      setInfo("We sent a 6-digit verification code to your email.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: unknown } | undefined)?.message;
        if (typeof message === "string" && message.length > 0) {
          setError(message);
          return;
        }
      }
      setError("Registration failed");
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setInfo("");

      const code = codeDigits.join("");
      await axios.post("http://localhost:5000/api/auth/verify-email", {
        email: pendingEmail,
        code,
      });

      const res = await signIn("credentials", {
        email: pendingEmail,
        password: pendingPassword,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error === "Email not verified" ? "Email verification is still pending." : "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: unknown } | undefined)?.message;
        if (typeof message === "string" && message.length > 0) {
          setError(message);
          return;
        }
      }
      setError("Verification failed");
    }
  };

  const onResend = async () => {
    try {
      setError("");
      setInfo("");
      await axios.post("http://localhost:5000/api/auth/resend-verification", { email: pendingEmail });
      setInfo("A new verification code was sent to your email.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { message?: unknown } | undefined)?.message;
        if (typeof message === "string" && message.length > 0) {
          setError(message);
          return;
        }
      }
      setError("Failed to resend code");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {step === "form" ? "Sign Up" : "Verify your email"}
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {info && <p className="text-green-600 text-center">{info}</p>}

        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                {...register("companyName")}
                type="text"
                className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                required
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative mt-1">
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
            >
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                if (savedData) reset(savedData);
              }}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Sign Up
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter the 6-digit code sent to <span className="font-bold text-gray-900">{pendingEmail}</span>
              </label>
              <div className="flex justify-between gap-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Verify & Sign in
            </button>
            <button
              type="button"
              onClick={onResend}
              className="w-full px-4 py-2 font-bold text-gray-900 bg-gray-100 rounded hover:bg-gray-200"
            >
              Resend code
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-900">
          Already have an account? <Link href="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

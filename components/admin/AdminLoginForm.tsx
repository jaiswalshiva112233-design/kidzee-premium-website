"use client";

import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: "OWNER" | "CENTRE_HEAD" | null;
    mustChangePassword?: boolean;
  };
};

export default function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result =
        (await response.json()) as LoginResponse;

      if (!response.ok || !result.success) {
        setError(
          result.message ??
            "Unable to sign in. Please try again.",
        );
        return;
      }

      router.replace(result.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to the admin panel. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearError() {
    if (error) {
      setError("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      noValidate
    >
      <div className="rounded-2xl border border-[#E5D8EC] bg-[#FAF7FC] p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEE3F4] text-[#6A328F]">
            <ShieldCheck
              aria-hidden="true"
              size={20}
            />
          </div>

          <div>
            <p className="text-sm font-black text-[#35243E]">
              Secure centre access
            </p>

            <p className="mt-1 text-xs leading-5 text-[#746779]">
              Centre Head users should enter their assigned
              email. The Owner can leave the email blank and
              use the existing owner password.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="admin-email"
            className="text-sm font-black text-[#35243E]"
          >
            Email address
          </label>

          <span className="text-xs font-bold text-[#8A7F8D]">
            Optional for Owner
          </span>
        </div>

        <div className="relative mt-2">
          <Mail
            aria-hidden="true"
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A459C]"
          />

          <input
            id="admin-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError();
            }}
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            placeholder="Enter your assigned email"
            disabled={isSubmitting}
            className="min-h-14 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-12 pr-4 text-base font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89DAD] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="text-sm font-black text-[#35243E]"
        >
          Password
        </label>

        <div className="relative mt-2">
          <LockKeyhole
            aria-hidden="true"
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A459C]"
          />

          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError();
            }}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isSubmitting}
            className="min-h-14 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-12 pr-12 text-base font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89DAD] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-70"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            disabled={isSubmitting}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#756A79] transition hover:bg-[#F3EAF8] hover:text-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6A328F]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={19} />
            ) : (
              <Eye aria-hidden="true" size={19} />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-base font-black text-white shadow-[0_14px_34px_rgba(91,42,134,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6A328F]/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              size={19}
              className="animate-spin"
            />
            Signing in…
          </>
        ) : (
          <>
            <LockKeyhole
              aria-hidden="true"
              size={19}
            />
            Sign In Securely
          </>
        )}
      </button>
    </form>
  );
}
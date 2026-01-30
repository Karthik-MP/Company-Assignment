"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast } from "sonner";

// ---------- validation ----------
const Schema = z
  .object({
    fullName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include at least 1 uppercase letter")
      .regex(/[a-z]/, "Include at least 1 lowercase letter")
      .regex(/[0-9]/, "Include at least 1 number"),
    confirmPassword: z.string(),
    role: z.enum(["Admin", "Counselor", "Reviewer"], {
      errorMap: () => ({ message: "Select a role" }),
    }),
    country: z.string().optional(),
    phone: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim())
      .refine(
        (v) => v === "" || /^[+0-9()\-\s]{7,20}$/.test(v),
        "Enter a valid phone number"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const errorMap = {
  "auth/email-already-in-use": "This email is already in use.",
  "auth/invalid-email": "Invalid email address.",
  "auth/weak-password": "Password is too weak.",
  "auth/operation-not-allowed":
    "Email/password signups are disabled for this project.",
};

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(Schema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      country: "",
      phone: "",
    },
  });

  async function onSubmit(values) {
    try {
      // 1) create user
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 2) update display name (and optionally photoURL later)
      await updateProfile(cred.user, { displayName: values.fullName });

      // 3) send verification email (optional but recommended)
      try {
        await sendEmailVerification(cred.user);
      } catch {
        /* non-fatal */
      }

      // 4) (optional) persist extra fields in Firestore:
      //    role, country, phone — if you want them available for the dashboard immediately
      // import { db } from "@/services/firebase";
      // import { doc, setDoc, serverTimestamp } from "firebase/firestore";
      // await setDoc(doc(db, "users", cred.user.uid), {
      //   fullName: values.fullName,
      //   email: values.email,
      //   role: values.role,
      //   country: values.country || null,
      //   phone: values.phone || null,
      //   createdAt: serverTimestamp(),
      // });

      toast.success(
        "Account created 🎉 We’ve sent a verification email. Redirecting…"
      );

      reset();
      router.push("/login");
    } catch (err) {
      const msg = errorMap[err?.code] || "Signup failed. Please try again.";
      toast.error(msg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-700">
            Create your account
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Join us and get started today
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="flex space-x-4">
              {/* Full Name */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  {...register("fullName")}
                  className="focus-visible:ring-indigo-500"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="focus-visible:ring-indigo-500"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.password && (
                <p className="text-red-600 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                {...register("role")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <option value="">Select role</option>
                <option value="Admin">Admin</option>
                <option value="Counselor">Counselor</option>
                <option value="Reviewer">Reviewer</option>
              </select>
              {errors.role && (
                <p className="text-red-600 text-sm">{errors.role.message}</p>
              )}
            </div>

            {/* Country (optional) */}
            <div className="space-y-2">
              <Label htmlFor="country">Country (optional)</Label>
              <Input
                id="country"
                placeholder="India / United States / ..."
                {...register("country")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.country && (
                <p className="text-red-600 text-sm">{errors.country.message}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555 555 5555"
                {...register("phone")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>

            {/* Redirect */}
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-indigo-600 hover:underline">
                Log in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

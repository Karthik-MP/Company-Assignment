"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loginWithEmail } from "@/services/auth/login";

// --- Validation schema ---
const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    getValues,
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  // console.log("Login form state:", {
  //   isValid,
  //   isDirty,
  //   isSubmitting,
  //   errors,
  //   currentValues: getValues(),
  // });

  const onSubmit = async (values) => {
    try {
      await loginWithEmail(values);

      toast.success("Login successful 🎉, Welcome back! Redirecting...");

      router.push("/dashboard");
    } catch (err) {
      console.log("Login error:", err);
      const rawMessage = err?.message || "";
      const code = err?.code || rawMessage.match(/\(auth\/(.+?)\)/)?.[1];

      let msg;

      if (rawMessage === "Please verify your email before logging in.") {
        msg = rawMessage;
      } else if (code === "user-not-found") {
        msg = "No account found with this email.";
      } else if (code === "invalid-credential") {
        msg = "Invalid email or password.";
      } else {
        msg = "Login failed. Please try again.";
      }

      toast.error(
        <div>
          <p className="font-semibold">Login error</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-700">
            Welcome Back
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">Log in to your account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
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

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </Button>

            {/* Redirect to signup */}
            <p className="text-sm text-center text-gray-600">
              Don’t have an account?{" "}
              <span
                onClick={() => router.push("/signup")}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

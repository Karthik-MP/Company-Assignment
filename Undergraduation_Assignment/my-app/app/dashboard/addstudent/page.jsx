"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
// import { signupWithEmail } from "@/services/auth/signup";

const AddStudentSchema = z
  .object({
    fullName: z.string().min(2, "Please enter full name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(7, "Phone number looks too short")
      .max(20, "Phone number looks too long"),
    country: z.string().min(1, "Select country"),
    grade: z.enum(["9", "10", "11", "12", "UG", "PG"], {
      errorMap: () => ({ message: "Select grade" }),
    }),

    // NEW FIELDS (match DB)
    status: z.enum(["Accepted", "Applying", "Submitted", "Shortlisting", "Exploring"], {
      errorMap: () => ({ message: "Select status" }),
    }),
    progress: z
      .number({ invalid_type_error: "Progress must be a number" })
      .min(0)
      .max(100),
    highIntent: z.boolean().default(false),
    needsEssayHelp: z.boolean().default(false),
  });


export default function AddStudentPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(AddStudentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      country: "",
      grade: undefined,
      status: "Accepted", // default to Accepted to match your sample
      progress: 0,
      highIntent: true, // your sample has true
      needsEssayHelp: true, // your sample has true
    },
    mode: "onBlur",
  });

  // keep checkbox/range in sync with zod number/boolean
  const progress = watch("progress");

  const onSubmit = async (values) => {
    try {
      // Create the students collection reference
      const studentsRef = collection(db, "students");

      // Prepare the student document data
      const payload = {
        country: values.country,
        createdAt: serverTimestamp(),
        email: values.email,
        email_lc: values.email.toLowerCase(),
        grade: values.grade,
        highIntent: values.highIntent,
        lastActive: serverTimestamp(),
        name: values.fullName,
        name_lc: values.fullName.toLowerCase(),
        needsEssayHelp: values.needsEssayHelp,
        phone: values.phone,
        progress: values.progress,
        status: values.status,
        updatedAt: serverTimestamp(),
      };

      // Add the document to Firestore
      await addDoc(studentsRef, payload);

      toast.success("Student added to the database!");
      router.push("/dashboard/students");
    } catch (err) {

      toast.error("Error", err?.message || "Failed to create student. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                {/* Full Name */}
                <div className="space-y-2 w-full md:w-1/2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                    id="fullName"
                    placeholder="Dr. Laverne Connelly"
                    {...register("fullName")}
                    className="focus-visible:ring-indigo-500"
                    />
                    {errors.fullName && (
                    <p className="text-red-600 text-sm">{errors.fullName.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2 w-full md:w-1/2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    {...register("email")}
                    className="focus-visible:ring-indigo-500"
                    />
                    {errors.email && (
                    <p className="text-red-600 text-sm">{errors.email.message}</p>
                    )}
                </div>
                </div>

            <div className="flex space-x-4">
              {/* Phone */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1-944-680-2863"
                  {...register("phone")}
                  className="focus-visible:ring-indigo-500"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Grade */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <select
                  id="grade"
                  {...register("grade")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <option value="">Select grade</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="UG">Undergraduate</option>
                  <option value="PG">Postgraduate</option>
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-sm">{errors.grade.message}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                {...register("country")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <option value="">Select country</option>
                <option value="Benin">Benin</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
              {errors.country && (
                <p className="text-red-600 text-sm">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* Status & Progress */}
            <div className="flex space-x-4">
              <div className="w-1/2 space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <option value="Accepted">Accepted</option>
                  <option value="Applying">Applying</option>
                  <option value="Shortlisting">Shortlisting</option>
                  <option value="Exploring">Exploring</option>
                  <option value="Submitted">Submitted</option>
                </select>
                {errors.status && (
                  <p className="text-red-600 text-sm">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="w-1/2 space-y-2">
                <Label htmlFor="progress">
                  Progress <span className="text-gray-500">({progress}%)</span>
                </Label>
                <input
                  id="progress"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                  value={progress}
                  onChange={(e) =>
                    setValue("progress", Number(e.target.value), {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.progress && (
                  <p className="text-red-600 text-sm">
                    {errors.progress.message}
                  </p>
                )}
              </div>
            </div>

            {/* Booleans */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("highIntent")}
                  className="h-4 w-4"
                />
                <span>High Intent</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("needsEssayHelp")}
                  className="h-4 w-4"
                />
                <span>Needs Essay Help</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex justify-center items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/students")}
                className="w-2/12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-2/12 bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? "Saving..." : "Add Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

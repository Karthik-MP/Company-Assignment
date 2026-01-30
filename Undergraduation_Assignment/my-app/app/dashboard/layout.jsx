"use client";
import "@/components/ui/sidebar.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  Sidebar, // <- add this
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
// (optional) import a Separator if you have one:
// import { Separator } from "@/components/ui/separator";
import { CopilotPopup } from "@copilotkit/react-ui";
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="animate-pulse text-indigo-700 font-semibold">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="min-h-screen" /*  is fine if you want */>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="mt-4" />
        <CopilotPopup
          instructions="You are assisting the admin by helping them navigate through different sections of the internal CRM tool. Provide guidance on each route and describe the available features.
            1. **Dashboard**: The dashboard gives a summary of student data, including engagement metrics and application statuses. Use this for quick insights.
            2. **Students List**: View all students. Use the search and filters to find specific students by name, ID, or other parameters.
            3. **Student Profile**: Click on a student’s name to view detailed information such as application status, engagement, and communication history.
            4. **Team**: This page allows you to manage tasks, assign them to team members, and filter by task priority or status.
          "
          labels={{
            title: "CRM Assistant",
            initial: "Hi! 👋 How can I assist you with your admin tasks today?",
          }}
        />
        <div>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

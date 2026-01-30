"use client";

import { useAuth } from "@/contexts/AuthContext";
import SummaryStats from "@/components/students/SummaryStats";
export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 my-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.displayName || 'User'}!</p>
      </div>
      
      <div className="mb-6">
        <SummaryStats />
      </div>
    </div>
  );
}
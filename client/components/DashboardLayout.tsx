"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RequireAuth from "@/components/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <div className="mt-8 text-center text-xs text-gray-400">
               Created by <a href="https://www.haplogic.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">HapLogic</a>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}


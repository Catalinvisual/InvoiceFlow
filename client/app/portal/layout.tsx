"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <div className="mt-8 text-center text-xs text-gray-400">
             Created by <a href="https://www.haplogic.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">HapLogic</a>
          </div>
        </main>
      </div>
    </div>
  );
}

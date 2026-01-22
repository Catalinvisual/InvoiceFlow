"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldCheck, CreditCard, Palette, X, Bell, HelpCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const vendorNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Templates", href: "/dashboard/templates", icon: Palette },
  { name: "Automation", href: "/dashboard/reminders", icon: Bell },
  { name: "Company Profile", href: "/dashboard/company-profile", icon: FileText },
  { name: "Payment Settings", href: "/dashboard/settings/payment", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
];

const adminNavItems = [
  { name: "Admin Panel", href: "/admin", icon: ShieldCheck },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscribers", href: "/admin/subscribers", icon: Bell },
  { name: "Revenue", href: "/admin/revenue", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const customerNavItems = [
  { name: "Portal", href: "/portal", icon: LayoutDashboard },
  { name: "My Invoices", href: "/portal/invoices", icon: FileText },
  { name: "Payments", href: "/portal/payments", icon: CreditCard },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "VENDOR";
  const plan = session?.user?.plan?.toUpperCase();

  let navItems = vendorNavItems;
  if (role === "SUPER_ADMIN") navItems = adminNavItems;
  if (role === "CUSTOMER") navItems = customerNavItems;

  // Safety net: If user has a paid plan (STARTER or PRO), they are definitely a VENDOR
  // This prevents paid users from seeing the Customer portal by mistake
  if (plan === 'PRO' || plan === 'STARTER') {
      if (role !== 'SUPER_ADMIN') {
          navItems = vendorNavItems;
      }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0F19] border-r border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-gray-800 px-4">
          <h1 className="text-xl font-bold text-white">
            {role === "SUPER_ADMIN" ? "SaaS Admin" : role === "CUSTOMER" ? "Client Portal" : "SaaS Invoice"}
          </h1>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()} // Close sidebar on link click (mobile)
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? "bg-blue-900/20 text-blue-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-800 bg-[#0B0F19]">
          <div className="mb-4 px-2">
              <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Current Plan</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      plan === 'PRO' ? 'bg-purple-900/30 text-purple-400' :
                      plan === 'STARTER' ? 'bg-green-900/30 text-green-400' :
                      'bg-gray-800 text-gray-300'
                  }`}>
                      {plan || 'FREE'}
                  </span>
              </div>
              <p className="text-sm font-medium text-gray-300 truncate">{session?.user?.email}</p>
              
              {plan !== 'PRO' && role === 'VENDOR' && (
                  <Link href="/dashboard/settings" className="mt-2 block w-full text-center text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1.5 rounded shadow-sm hover:shadow transition-all">
                      Upgrade to PRO 🚀
                  </Link>
              )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

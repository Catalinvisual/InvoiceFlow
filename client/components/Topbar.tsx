"use client";

import { useSession } from "next-auth/react";
import { Menu, Bell, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import useApi from "@/hooks/useApi";
import Link from "next/link";

interface TopbarProps {
  onMenuClick?: () => void;
}

type Notification = {
  id: string;
  type: 'overdue' | 'due_soon' | 'paid';
  title: string;
  message: string;
  date: Date;
  link: string;
  read: boolean;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data } = useSession();
  const api = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
        setLoading(true);
        const response = await api.get('/invoices');
        const invoices = response.data;
        
        const newNotifications: Notification[] = [];
        const today = new Date();

        invoices.forEach((inv: any) => {
            const dueDate = new Date(inv.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (inv.status === 'overdue') {
                newNotifications.push({
                    id: `overdue-${inv.id}`,
                    type: 'overdue',
                    title: `Invoice #${inv.invoiceNumber} Overdue`,
                    message: `${inv.client.name} - ${inv.total} €`,
                    date: dueDate,
                    link: `/dashboard/invoices/${inv.id}`,
                    read: false
                });
            } else if (inv.status === 'pending' && daysUntilDue <= 3 && daysUntilDue >= 0) {
                newNotifications.push({
                    id: `due-${inv.id}`,
                    type: 'due_soon',
                    title: `Invoice #${inv.invoiceNumber} Due Soon`,
                    message: `Due in ${daysUntilDue === 0 ? 'today' : daysUntilDue + ' days'} - ${inv.total} €`,
                    date: dueDate,
                    link: `/dashboard/invoices/${inv.id}`,
                    read: false
                });
            }
        });

        // Sort by date (newest/most urgent first)
        newNotifications.sort((a, b) => b.date.getTime() - a.date.getTime());
        setNotifications(newNotifications);
    } catch (error) {
        console.error("Failed to fetch notifications", error);
    } finally {
        setLoading(false);
    }
  }, [api]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (data?.user) {
        fetchNotifications();
    }
  }, [data, fetchNotifications]);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.companyName) {
          setCompanyName(res.data.companyName);
        }
      } catch (error) {
        console.error('Failed to fetch company settings', error);
      }
    };

    if (data?.user) {
      fetchCompanySettings();
    }
  }, [data, api]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
            type="button" 
            className="md:hidden -ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={onMenuClick}
        >
            <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                        <span className="text-xs text-gray-500">{notifications.length} alerts</span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <div className="p-3 bg-gray-50 rounded-full">
                                    <Bell className="h-5 w-5 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <Link 
                                        href={notification.link} 
                                        key={notification.id}
                                        onClick={() => setShowNotifications(false)}
                                        className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group relative"
                                    >
                                        <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${
                                            notification.type === 'overdue' ? 'bg-red-50 text-red-600' :
                                            notification.type === 'due_soon' ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {notification.type === 'overdue' && <AlertTriangle size={16} />}
                                            {notification.type === 'due_soon' && <Clock size={16} />}
                                            {notification.type === 'paid' && <CheckCircle size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {/* We could use formatDistanceToNow here if date-fns is available, or just simple date */}
                                                {notification.date.toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2"></div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* User Info */}
        <div className="text-sm text-gray-700 truncate max-w-[200px] font-medium border-l pl-4 border-gray-200">
            {companyName || data?.user?.companyName || data?.user?.email}
        </div>
      </div>
    </div>
  );
}

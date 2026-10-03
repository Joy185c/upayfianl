"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Wallet, History, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/store";
import { Toaster } from "react-hot-toast";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const fetchData = useWalletStore((state) => state.fetchData);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    fetchData();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router, fetchData]);

  if (!isClient) return null;

  const navItems = [
    { name: "Home", href: "/customer/home", icon: Home },
    { name: "Money", href: "/customer/money", icon: Wallet },
    { name: "History", href: "/customer/history", icon: History },
    { name: "Benefits", href: "/customer/impactiq", icon: Gift },
    { name: "Profile", href: "/customer/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-900 sm:py-6 flex items-center justify-center p-0 sm:p-4">
      <div className="flex flex-col h-screen sm:h-[844px] w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden font-sans sm:rounded-[2.5rem] sm:border-[8px] sm:border-slate-800">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              borderRadius: '16px',
              background: '#0555A4',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }
          }} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 bg-background scrollbar-none">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 w-full bg-white border-t border-border/50 px-1 sm:px-2 py-1.5 flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center flex-1 h-13 group relative py-1"
              >
                {isActive && (
                  <div className="absolute top-0 w-7 h-1 bg-upay-yellow rounded-b-full shadow-[0_2px_8px_rgba(251,214,0,0.5)]" />
                )}
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-upay-navy/5 text-upay-navy transform -translate-y-0.5"
                      : "text-muted-foreground group-hover:bg-muted"
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-semibold transition-colors mt-0.5 leading-none",
                    isActive ? "text-upay-navy font-bold" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

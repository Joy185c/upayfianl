"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users, Zap, TrendingUp, Settings, LogOut, Database, Brain, Sparkles, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  if (!isClient) return null;

  const navigationGroups = [
    {
      label: "Platform",
      items: [
        { name: "Overview", href: "/authority/overview", icon: LayoutDashboard },
      ],
    },
    {
      label: "Growth Intelligence",
      items: [
        { 
          name: "Voice AI Agent", 
          href: "/authority/voice-agent", 
          icon: Mic,
          badge: "Live Voice",
          highlight: true 
        },
        { 
          name: "Seasonal Growth Studio", 
          href: "/authority/seasonal-growth", 
          icon: Sparkles,
          badge: "AI Engine",
        },
        { name: "Uplift & NBO", href: "/authority/uplift", icon: TrendingUp },
        { name: "Campaigns", href: "/authority/campaigns", icon: Zap },
        { name: "Segments", href: "/authority/segments", icon: Users },
      ],
    },
    {
      label: "Data & Governance",
      items: [
        { name: "Data Management", href: "/authority/data", icon: Database },
        { name: "How AI Works", href: "/authority/how-ai-works", icon: Brain },
        { name: "Settings", href: "/authority/settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-upay-navy text-white flex flex-col shadow-xl z-20">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
              <Image
                src="/logo.png"
                alt="ImpactIQ Logo"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-none">ImpactIQ</h2>
              <span className="text-[11px] text-white/60 font-medium">Control Center</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-white/40">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/authority/overview" && pathname.startsWith(item.href));
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                      isActive
                        ? "bg-upay-blue text-white shadow-md font-bold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={18} className={isActive ? "text-upay-yellow" : item.highlight ? "text-amber-400" : ""} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0",
                        isActive ? "bg-upay-yellow text-upay-navy" : "bg-upay-yellow/20 text-upay-yellow border border-upay-yellow/40"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-red-400 transition-colors text-sm font-semibold"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

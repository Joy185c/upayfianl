"use client";

import { useState } from "react";
import { User, Settings, LogOut, Shield, Edit3, Bell, Lock, HelpCircle } from "lucide-react";
import { useWalletStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { wallet, resetDemoData } = useWalletStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Signed out successfully.");
    router.push("/");
  };

  const handleResetDemo = async () => {
    if (confirm("Reset demo data to initial state?")) {
      await resetDemoData();
      toast.success("Demo data reset!");
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-full">
      {/* Header Banner */}
      <div className="bg-upay-navy text-white px-6 pt-12 pb-16 rounded-b-[2rem] shadow-md relative">
        <div className="flex justify-between items-center z-10 relative">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button 
            onClick={handleLogout} 
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-5 relative -mt-12">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-border/50 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-upay-yellow rounded-full border-4 border-white shadow-md flex items-center justify-center -mt-14 mb-3 relative">
            <User size={36} className="text-upay-navy" />
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-upay-navy text-white rounded-full shadow-md hover:bg-upay-navy/90 transition"
            >
              <Edit3 size={12} />
            </button>
          </div>

          <h2 className="text-xl font-black text-upay-navy">{wallet.display_name}</h2>
          <p className="text-muted-foreground text-xs font-semibold mt-0.5">{wallet.phone_number}</p>

          <div className="mt-3 flex items-center gap-2">
            <span className="px-3 py-1 bg-upay-blue/10 text-upay-blue rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Shield size={12} />
              {wallet.segment.replace("_", " ")} Tier
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs h-7 px-3 rounded-full border-border text-upay-navy font-bold"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="px-5 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <User size={18} className="text-upay-blue" />
              <span className="font-semibold text-xs text-upay-navy">Edit Account Information</span>
            </div>
            <Edit3 size={14} className="text-muted-foreground" />
          </div>

          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-upay-blue" />
              <span className="font-semibold text-xs text-upay-navy">Change 4-Digit Upay PIN</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">PIN: {wallet.pin}</span>
          </div>

          <div 
            onClick={handleResetDemo}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition text-amber-600"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={18} />
              <span className="font-semibold text-xs">Reset Demo State</span>
            </div>
            <span className="text-[10px] font-bold uppercase">Reset</span>
          </div>

          <div 
            onClick={handleLogout} 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span className="font-bold text-xs">Sign Out</span>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}

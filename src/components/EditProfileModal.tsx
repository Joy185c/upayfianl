"use client";

import { useState } from "react";
import { User, Phone, Lock, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";
import toast from "react-hot-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { wallet, updateProfile } = useWalletStore();

  const [name, setName] = useState(wallet.display_name);
  const [phone, setPhone] = useState(wallet.phone_number);
  const [pin, setPin] = useState(wallet.pin);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!pin || pin.length < 4) {
      toast.error("PIN must be 4 digits.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name, phone, pin);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        {/* Banner */}
        <div className="bg-upay-navy text-white px-4 sm:px-6 pt-5 pb-5 relative flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-2xl shrink-0">
              <User size={20} className="text-upay-yellow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Edit Profile</h2>
              <p className="text-[11px] text-white/70">Update account & PIN</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
              4-Digit Security PIN
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-upay-blue"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl font-bold border-border text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] py-4 rounded-xl bg-upay-navy text-white hover:bg-upay-navy/90 font-bold text-xs"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

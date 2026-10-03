"use client";

import { useEffect } from "react";
import { Bell, CheckCheck, X, ArrowUpRight, Gift, Info } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, markNotificationsAsRead, hasUnreadNotifications } = useWalletStore();

  useEffect(() => {
    if (isOpen && hasUnreadNotifications) {
      markNotificationsAsRead();
    }
  }, [isOpen, hasUnreadNotifications, markNotificationsAsRead]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "transaction":
        return <ArrowUpRight size={16} className="text-upay-blue" />;
      case "benefit":
      case "offer":
        return <Gift size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-upay-navy" />;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="bg-upay-navy text-white px-4 sm:px-6 pt-5 pb-5 relative flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
              <Bell size={20} className="text-upay-yellow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Notifications</h2>
              <p className="text-[11px] text-white/70">Recent updates & offers</p>
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
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-2.5 px-1">
            <span className="text-[11px] font-bold text-upay-navy uppercase tracking-wider">All Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={markNotificationsAsRead}
              className="text-[11px] text-upay-blue hover:text-upay-navy font-semibold flex items-center gap-1 h-auto p-1"
            >
              <CheckCheck size={13} /> Mark all read
            </Button>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.type === 'offer' && notif.transaction_id) {
                      window.location.href = `/customer/impactiq?campaignId=${notif.transaction_id}`;
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all flex gap-2.5 items-start cursor-pointer hover:bg-slate-50 ${
                    notif.is_read 
                      ? "bg-white border-border/60" 
                      : "bg-upay-yellow/10 border-upay-yellow/40 shadow-sm"
                  }`}
                >
                  <div className="p-1.5 rounded-xl bg-muted/60 shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5 gap-1">
                      <h4 className="text-xs font-bold text-upay-navy truncate">{notif.title}</h4>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{notif.message}</p>
                    {notif.type === 'offer' && (
                      <div className="mt-1.5 text-[10px] font-bold text-upay-blue flex items-center gap-1">
                        View Offer <ArrowUpRight size={10} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs bg-muted/20 rounded-2xl border border-dashed border-border">
              No notifications yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

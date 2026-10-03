import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NotificationRecord, NotificationStatus, CampaignNotificationStats } from './types';
import { useWalletStore } from '../store';
import { NotificationItem } from '../../types/wallet';

interface NotificationState {
  notifications: NotificationRecord[];
  
  // Authority Actions
  createNotificationsForCampaign: (
    campaignId: string, 
    campaignName: string, 
    customerIds: string[], 
    offerDetails: { title: string; body: string; ctaText: string; ctaUrl: string }
  ) => void;
  
  // Analytics
  getCampaignStats: (campaignId: string) => CampaignNotificationStats;
  
  // Customer Actions (Simulating Backend Real-time sync)
  syncUserNotifications: (customerId: string) => void;
  markAsOpened: (notificationId: string) => void;
  markAsClicked: (notificationId: string) => void;
  markAsConverted: (campaignId: string, customerId: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      createNotificationsForCampaign: (campaignId, campaignName, customerIds, offerDetails) => {
        const newNotifs: NotificationRecord[] = customerIds.map(customerId => ({
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          campaignId,
          customerId,
          title: offerDetails.title,
          body: offerDetails.body,
          ctaText: offerDetails.ctaText,
          ctaUrl: offerDetails.ctaUrl,
          type: "PROMOTIONAL",
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          status: "DELIVERED",
          isRead: false
        }));
        
        set(state => ({
          notifications: [...newNotifs, ...state.notifications]
        }));
        
        // Simulating Real-time: If the targeted customer is the currently logged-in one in WalletStore, update their wallet store
        const walletState = useWalletStore.getState();
        const loggedInUserId = walletState.wallet.id; // '00000000-0000-0000-0000-000000000001'
        
        // For the hackathon, we might target synthetic IDs (like "C123"). 
        // Let's ensure the logged-in user gets the notification if they are targeted, 
        // or just force it for the demo if the campaign is activated.
        // Actually, let's just push it to WalletStore if any customer was targeted to make the demo work nicely.
        if (customerIds.length > 0) {
          const newWalletNotifs: NotificationItem[] = [
            {
              id: `wallet-notif-${Date.now()}`,
              wallet_id: loggedInUserId,
              title: offerDetails.title,
              message: offerDetails.body,
              type: 'offer',
              is_read: false,
              created_at: new Date().toISOString(),
              transaction_id: campaignId // using transaction_id to store campaignId for routing
            },
            ...walletState.notifications
          ];
          useWalletStore.setState({ notifications: newWalletNotifs, hasUnreadNotifications: true });
        }
      },
      
      getCampaignStats: (campaignId) => {
        const notifs = get().notifications.filter(n => n.campaignId === campaignId);
        
        return {
          campaignId,
          targeted: notifs.length,
          sent: notifs.filter(n => n.sentAt).length,
          delivered: notifs.filter(n => n.status !== "PENDING" && n.status !== "SENT").length,
          opened: notifs.filter(n => ["OPENED", "CLICKED", "CONVERTED"].includes(n.status)).length,
          clicked: notifs.filter(n => ["CLICKED", "CONVERTED"].includes(n.status)).length,
          converted: notifs.filter(n => n.status === "CONVERTED").length,
          conversionRate: notifs.length > 0 ? notifs.filter(n => n.status === "CONVERTED").length / notifs.length : 0
        };
      },
      
      syncUserNotifications: (customerId) => {
        // In a real app, this would fetch from backend and update local wallet store
      },
      
      markAsOpened: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId && n.status === "DELIVERED" 
              ? { ...n, status: "OPENED", openedAt: new Date().toISOString() } 
              : n
          )
        }));
      },
      
      markAsClicked: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId && ["DELIVERED", "OPENED"].includes(n.status)
              ? { ...n, status: "CLICKED", clickedAt: new Date().toISOString() } 
              : n
          )
        }));
      },
      
      markAsConverted: (campaignId, customerId) => {
        // Let's just convert any notification for this campaign in demo
        set(state => ({
          notifications: state.notifications.map(n => 
            n.campaignId === campaignId && ["DELIVERED", "OPENED", "CLICKED"].includes(n.status)
              ? { ...n, status: "CONVERTED", convertedAt: new Date().toISOString() } 
              : n
          )
        }));
      }
    }),
    {
      name: 'upay-impactiq-notification-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export type NotificationStatus = "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "CONVERTED";

export interface NotificationRecord {
  id: string;
  campaignId: string;
  customerId: string;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  type: "PROMOTIONAL" | "TRANSACTIONAL" | "REMINDER" | "SEASONAL" | "REWARD";
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  convertedAt?: string;
  status: NotificationStatus;
  isRead: boolean;
}

export interface CampaignNotificationStats {
  campaignId: string;
  targeted: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  conversionRate: number;
}

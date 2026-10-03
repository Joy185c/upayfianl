import { CustomerProfile, CustomerSegmentType, LifecycleStage, CustomerFeatures } from "../intelligence/types";
import { RawCustomer } from "./types";

/**
 * Calculates days between a past date string and today (mocked to match demo data)
 */
function getDaysSince(dateStr: string): number {
  const past = new Date(dateStr).getTime();
  const now = new Date("2026-10-02").getTime(); // Locking to demo timeline
  const diff = Math.floor((now - past) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Transforms Raw JSON Data into Canonical Customer Profile with Features
 * This acts as the Feature Engineering layer.
 */
export function extractFeatures(raw: RawCustomer): CustomerProfile {
  const txs = raw.transactions || [];
  const camps = raw.campaignHistory || [];

  // Filter valid recent transactions
  const txs30d = txs.filter(t => t.status === "SUCCESS" && getDaysSince(t.date) <= 30);
  const txs90d = txs.filter(t => t.status === "SUCCESS" && getDaysSince(t.date) <= 90);
  const txs7d = txs.filter(t => t.status === "SUCCESS" && getDaysSince(t.date) <= 7);

  // Totals
  const totalTxValue30d = txs30d.reduce((sum, t) => sum + t.amount, 0);
  const avgTxValue30d = txs30d.length > 0 ? totalTxValue30d / txs30d.length : 0;
  
  // Last transaction
  const sortedTxs = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const daysSinceLastTx = sortedTxs.length > 0 ? getDaysSince(sortedTxs[0].date) : 999;

  // Service Breakdowns (30d)
  let rechargeCount30d = 0;
  let merchantPayCount30d = 0;
  let billPayCount30d = 0;
  let sendMoneyCount30d = 0;
  let cashoutCount30d = 0;
  let addMoneyCount30d = 0;

  const serviceCounts: Record<string, number> = {};

  txs30d.forEach(t => {
    serviceCounts[t.type] = (serviceCounts[t.type] || 0) + 1;
    if (t.type === "recharge") rechargeCount30d++;
    if (t.type === "merchant_payment") merchantPayCount30d++;
    if (t.type === "bill_payment") billPayCount30d++;
    if (t.type === "send_money") sendMoneyCount30d++;
    if (t.type === "cash_out") cashoutCount30d++;
    if (t.type === "add_money") addMoneyCount30d++;
  });

  // Find most used service
  let mostUsedService = "unknown";
  let maxCount = 0;
  Object.entries(serviceCounts).forEach(([svc, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedService = svc;
    }
  });

  // Campaigns
  const camps30d = camps.filter(c => getDaysSince(c.date) <= 30);
  const camps7d = camps.filter(c => getDaysSince(c.date) <= 7);
  
  const sortedCamps = [...camps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const daysSinceLastOffer = sortedCamps.length > 0 ? getDaysSince(sortedCamps[0].date) : 999;
  
  const respondedCamps = camps.filter(c => c.responded);
  const sortedResponded = [...respondedCamps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const daysSinceLastRedemption = sortedResponded.length > 0 ? getDaysSince(sortedResponded[0].date) : 999;

  const campaignResponseRate = camps.length > 0 ? respondedCamps.length / camps.length : 0;
  
  // Lifecycle Calculation
  let lifecycle: LifecycleStage = "ENGAGEMENT";
  if (raw.profile.tenureDays < 30) lifecycle = "ACQUISITION";
  else if (txs90d.length === 0) lifecycle = "WIN_BACK";
  else if (daysSinceLastTx > 30) lifecycle = "RETENTION";
  else if (txs30d.length > 10) lifecycle = "ENGAGEMENT";
  else lifecycle = "ACTIVATION";

  // Mock Trend for simplicity
  const txFrequency = txs30d.length / 30; // avg tx per day
  const activityTrend = txs7d.length > (txs30d.length / 4) ? 0.2 : -0.1;

  const features: CustomerFeatures = {
    customerId: raw.customerId,
    transactions7d: txs7d.length,
    transactions30d: txs30d.length,
    transactions90d: txs90d.length,
    totalTxValue30d,
    avgTxValue30d,
    daysSinceLastTx,
    txFrequency,
    txTrend: activityTrend,

    rechargeCount30d,
    merchantPayCount30d,
    billPayCount30d,
    sendMoneyCount30d,
    cashoutCount30d,
    addMoneyCount30d,

    offersReceived7d: camps7d.length,
    offersReceived30d: camps30d.length,
    campaignResponseRate,
    campaignRedemptionRate: campaignResponseRate, // simplified
    sameCategoryOfferCount: 1, // simplified
    daysSinceLastOffer,
    daysSinceLastRedemption,

    preferredHour: 14,
    preferredChannel: "push",
    activeDays30d: txs30d.length, // approximation
    activityTrend,

    accountAge: raw.profile.tenureDays,
    servicesDiversity: Object.keys(serviceCounts).length / 5,
    inactivityDays: daysSinceLastTx,
    mostUsedService,

    treatmentCount: camps.length,
    controlCount: 0,
    historicalResponseRate: campaignResponseRate,
    historicalUplift: 0.1, // mocked for now

    marketingConsent: raw.consent?.marketing,
  };

  // Assign arbitrary segment based on features
  let segment: CustomerSegmentType = "active_user";
  if (rechargeCount30d > 5) segment = "recharge_heavy";
  if (daysSinceLastTx > 45) segment = "dormant";

  return {
    id: raw.customerId,
    displayName: raw.profile.name,
    phone: "01700000000", // mocked/redacted
    accountAge: raw.profile.tenureDays,
    segment,
    features,
    lifecycle,
    avgMonthlyValue: totalTxValue30d,
    totalTransactions: txs.length,
  };
}

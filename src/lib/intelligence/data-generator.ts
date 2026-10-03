/**
 * ImpactIQ — Synthetic Data Generator
 * Generates realistic MFS customer behavioral clusters.
 * Uses deterministic seeding so results are reproducible.
 */

import type {
  CustomerProfile,
  CustomerFeatures,
  CustomerSegmentType,
} from "./types";

// ─── Seeded PRNG (deterministic) ─────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = mulberry32(42); // fixed seed for reproducibility

function rand(min = 0, max = 1) {
  return min + rng() * (max - min);
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Segment Cluster Definitions ─────────────────────────────────────────────

type ClusterDef = {
  segment: CustomerSegmentType;
  weight: number; // relative proportion
  features: () => Partial<CustomerFeatures>;
};

// We design the synthetic data so the logistic regression mathematically classifies them correctly.
const CLUSTERS: ClusterDef[] = [
  {
    segment: "sure_thing",
    weight: 15,
    features: () => ({
      // Very high natural activity pushes Control P(Response) > 0.6
      transactions30d: randInt(25, 45),
      totalTxValue30d: rand(15000, 30000),
      rechargeCount30d: randInt(15, 25),
      merchantPayCount30d: randInt(10, 20),
      daysSinceLastTx: 0,
      offersReceived30d: randInt(1, 3), // Low fatigue
      daysSinceLastRedemption: randInt(30, 90), // Doesn't need offers
      accountAge: randInt(365, 1000),
    }),
  },
  {
    segment: "persuadable",
    weight: 40,
    features: () => ({
      // Moderate activity (Control P < 0.5), but highly responsive to offers (Treatment P > 0.6)
      transactions30d: randInt(5, 12),
      totalTxValue30d: rand(1500, 5000),
      rechargeCount30d: randInt(2, 6),
      merchantPayCount30d: randInt(1, 4),
      daysSinceLastTx: randInt(2, 7),
      offersReceived30d: randInt(1, 4), // Moderate offers
      daysSinceLastRedemption: randInt(2, 14), // Highly responsive recently
      accountAge: randInt(90, 365),
    }),
  },
  {
    segment: "lost_cause",
    weight: 30,
    features: () => ({
      // Very low activity across the board. Treatment & Control < 0.1
      transactions30d: randInt(0, 2),
      totalTxValue30d: rand(0, 500),
      rechargeCount30d: randInt(0, 1),
      merchantPayCount30d: 0,
      daysSinceLastTx: randInt(15, 60),
      offersReceived30d: randInt(2, 6), // Ignored offers
      daysSinceLastRedemption: randInt(100, 300),
      accountAge: randInt(30, 180),
    }),
  },
  {
    segment: "negative_uplift",
    weight: 15,
    features: () => ({
      // Activity is decent, but severe fatigue causes offers to suppress response.
      transactions30d: randInt(8, 15),
      totalTxValue30d: rand(2000, 8000),
      rechargeCount30d: randInt(3, 8),
      merchantPayCount30d: randInt(1, 3),
      daysSinceLastTx: randInt(1, 4),
      offersReceived7d: randInt(5, 8), // Overwhelmed this week
      offersReceived30d: randInt(12, 20), // Highly fatigued (triggers penalty > 1)
      daysSinceLastRedemption: randInt(60, 120), // Stopped redeeming due to annoyance
      accountAge: randInt(180, 500),
    }),
  },
];


// ─── Name / Phone generators ──────────────────────────────────────────────────

const FIRST_NAMES = [
  "Karim", "Rahim", "Fatema", "Nadia", "Hasan", "Mita",
  "Sumon", "Ritu", "Jamal", "Lipi", "Tariq", "Sadia",
  "Monir", "Puja", "Kabir", "Rupa", "Tanvir", "Moni",
  "Arif", "Soma", "Shahid", "Mina", "Nazrul", "Tania",
];
const LAST_NAMES = [
  "Mondal", "Hossain", "Islam", "Begum", "Miah", "Khanam",
  "Ahmed", "Akter", "Khan", "Rahman", "Sarkar", "Biswas",
];

// ─── Feature defaults ─────────────────────────────────────────────────────────

function defaultFeatures(id: string): CustomerFeatures {
  return {
    customerId: id,
    transactions7d: 2,
    transactions30d: 8,
    transactions90d: 22,
    totalTxValue30d: 2000,
    avgTxValue30d: 250,
    daysSinceLastTx: 3,
    txFrequency: 0.27,
    txTrend: 0,
    rechargeCount30d: 3,
    merchantPayCount30d: 2,
    billPayCount30d: 1,
    sendMoneyCount30d: 1,
    cashoutCount30d: 1,
    addMoneyCount30d: 1,
    offersReceived7d: 1,
    offersReceived30d: 3,
    campaignResponseRate: 0.35,
    campaignRedemptionRate: 0.2,
    sameCategoryOfferCount: 2,
    daysSinceLastOffer: 7,
    daysSinceLastRedemption: 14,
    preferredHour: 20,
    preferredChannel: "push",
    activeDays30d: 12,
    activityTrend: 0,
    accountAge: 180,
    servicesDiversity: 0.5,
    inactivityDays: 0,
    mostUsedService: "recharge",
    treatmentCount: 2,
    controlCount: 1,
    historicalResponseRate: 0.35,
    historicalUplift: 0.15,
  };
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateSyntheticCustomers(count = 200): CustomerProfile[] {
  rng = mulberry32(42); // reset for determinism

  // Build weighted cluster list
  const weightedClusters: ClusterDef[] = [];
  for (const cluster of CLUSTERS) {
    for (let i = 0; i < cluster.weight; i++) weightedClusters.push(cluster);
  }

  const customers: CustomerProfile[] = [];

  for (let i = 0; i < count; i++) {
    const cluster = weightedClusters[i % weightedClusters.length];
    const id = `C${String(1001 + i).padStart(4, "0")}`;
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);

    const clusterFeats = cluster.features();
    const base = defaultFeatures(id);

    // Merge cluster overrides
    const features: CustomerFeatures = { ...base, ...clusterFeats, customerId: id };

    // Derive computed features
    features.transactions7d =
      features.transactions7d ?? Math.round(features.transactions30d * 0.25);
    features.transactions90d =
      features.transactions90d ?? features.transactions30d * 3;
    features.avgTxValue30d =
      features.transactions30d > 0
        ? features.totalTxValue30d / features.transactions30d
        : 0;
    features.txFrequency = features.transactions30d / 30;
    features.activeDays30d = Math.min(
      30,
      Math.ceil(features.transactions30d * 1.5)
    );
    features.servicesDiversity = clamp(
      [
        features.rechargeCount30d,
        features.merchantPayCount30d,
        features.billPayCount30d,
        features.sendMoneyCount30d,
        features.cashoutCount30d,
      ].filter((v) => v > 0).length / 5
    );

    // Pick most used service
    const svcMap: [string, number][] = [
      ["recharge", features.rechargeCount30d],
      ["merchant_payment", features.merchantPayCount30d],
      ["bill_payment", features.billPayCount30d],
      ["send_money", features.sendMoneyCount30d],
      ["cash_out", features.cashoutCount30d],
    ];
    features.mostUsedService = svcMap.sort((a, b) => b[1] - a[1])[0][0];

    // Preferred hour: most segments active in evening
    features.preferredHour =
      cluster.segment === "high_value" ? randInt(9, 18) : randInt(18, 22);

    // preferred channel
    features.preferredChannel = pick(["push", "push", "sms", "in_app"]) as CustomerFeatures["preferredChannel"];

    // Avg monthly value
    const avgMonthlyValue = features.totalTxValue30d + rand(-200, 200);

    customers.push({
      id,
      displayName: `${firstName} ${lastName}`,
      phone: `017${String(randInt(10000000, 99999999))}`,
      accountAge: features.accountAge,
      segment: cluster.segment,
      features,
      lifecycle: inferLifecycle(features),
      avgMonthlyValue: Math.max(0, avgMonthlyValue),
      totalTransactions: features.transactions90d,
    });
  }

  return customers;
}

export function inferLifecycle(f: CustomerFeatures): import("./types").LifecycleStage {
  if (f.accountAge <= 14) return "ACQUISITION";
  if (f.accountAge <= 60 && f.transactions30d <= 5) return "ACTIVATION";
  if (f.inactivityDays >= 30) return "WIN_BACK";
  if (
    f.daysSinceLastTx >= 14 ||
    f.activityTrend < -0.2 ||
    f.transactions30d <= 3
  )
    return "RETENTION";
  if (f.transactions30d >= 8 && f.activityTrend >= 0) return "ENGAGEMENT";
  return "ACTIVATION";
}

// ─── Campaign Definitions ─────────────────────────────────────────────────────

export function getDefaultCampaigns(): import("./types").Campaign[] {
  return [
    {
      id: "CAM001",
      name: "20% Recharge Cashback",
      offerType: "recharge_cashback",
      cashbackAmount: 20,
      minTransaction: 100,
      budgetTotal: 300000,
      budgetUsed: 0,
      capacityLimit: 80000,
      channel: "push",
      targetProduct: "mobile_recharge",
      duration: 14,
      isActive: true,
    },
    {
      id: "CAM002",
      name: "10% Merchant Payment Cashback",
      offerType: "merchant_cashback",
      cashbackAmount: 50,
      minTransaction: 200,
      budgetTotal: 200000,
      budgetUsed: 0,
      capacityLimit: 60000,
      channel: "push",
      targetProduct: "merchant_payment",
      duration: 7,
      isActive: true,
    },
    {
      id: "CAM003",
      name: "Zero Fee Bill Payment",
      offerType: "bill_payment_benefit",
      cashbackAmount: 0,
      minTransaction: 0,
      budgetTotal: 150000,
      budgetUsed: 0,
      capacityLimit: 50000,
      channel: "sms",
      targetProduct: "bill_payment",
      duration: 30,
      isActive: true,
    },
    {
      id: "CAM004",
      name: "Send Money ৳10 Discount",
      offerType: "send_money_benefit",
      cashbackAmount: 10,
      minTransaction: 500,
      budgetTotal: 350000,
      budgetUsed: 0,
      capacityLimit: 90000,
      channel: "push",
      targetProduct: "send_money",
      duration: 14,
      isActive: true,
    },
  ];
}

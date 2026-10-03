"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Demo users — no backend needed for Vercel deployment
const DEMO_USERS = {
  customer: {
    id: 1001,
    email: "c1001@upay.com",
    role: "customer",
    customer_id: "C1001",
    display_name: "Karim Mondal",
  },
  authority: {
    id: 9001,
    email: "authority@upay.com",
    role: "authority",
  },
};

// Minimal JWT-like token for demo (base64 encoded payload)
function makeDemoToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() / 1000 + 604800 }));
  return `${header}.${body}.demo_signature`;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (role: "customer" | "authority") => {
    setLoading(true);
    try {
      const user = DEMO_USERS[role];
      const token = makeDemoToken({ sub: String(user.id), role: user.role });

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (role === "customer") {
        router.push("/customer/home");
      } else {
        router.push("/authority/overview");
      }
    } catch (error) {
      console.error("Login failed", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4 sm:p-6">
      <div className="mb-8 text-center max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2 border-4 border-white shadow-xl flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="ImpactIQ Logo"
              width={110}
              height={110}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-upay-navy">Upay ImpactIQ</h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base font-medium">Growth &amp; Campaign Intelligence Platform</p>
      </div>

      <div className="grid gap-4 sm:gap-6 w-full max-w-xl md:grid-cols-2">
        <Card className="hover:border-upay-blue transition-all cursor-pointer shadow-md hover:shadow-lg rounded-2xl" onClick={() => handleLogin("customer")}>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-upay-navy">Customer App</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Experience the personalized MFS app powered by ImpactIQ.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
            <Button className="w-full font-bold py-5 rounded-xl bg-upay-navy text-white hover:bg-upay-navy/90" disabled={loading}>
              Continue as Customer
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-upay-navy transition-all cursor-pointer shadow-md hover:shadow-lg rounded-2xl" onClick={() => handleLogin("authority")}>
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-upay-navy">Control Center</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Access the AI-powered growth and campaign intelligence dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
            <Button variant="secondary" className="w-full bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-bold py-5 rounded-xl" disabled={loading}>
              Continue as Authority
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

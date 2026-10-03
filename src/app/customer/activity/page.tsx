"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HistoryPage from "../history/page";

export default function ActivityRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer/history");
  }, [router]);

  return <HistoryPage />;
}

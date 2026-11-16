import { Suspense } from "react";

import { DbStatus, DbStatusSkeleton } from "@/components/db-status";

export default function Home() {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Flan</h1>
        <p className="text-muted-foreground">Meal planning with real nutrition. Under reconstruction.</p>
      </div>
      {/* Everything above is prerendered; the counts stream in per request. */}
      <Suspense fallback={<DbStatusSkeleton />}>
        <DbStatus />
      </Suspense>
    </>
  );
}

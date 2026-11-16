import { unstable_rethrow } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReferenceCounts, type ReferenceCounts } from "@/server/queries/status";

// Temporary (M1): replaced by real pages at M2.

const labels: Record<keyof ReferenceCounts, string> = {
  recipes: "Recipes",
  foods: "Foods",
  ingredients: "Ingredient lines",
  measurements: "Unit conversions",
  units: "Units",
  recipeTags: "Recipe tags",
};

function StatusCard({ description, children }: { description: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Database status</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

/** Async Server Component: render inside `<Suspense fallback={<DbStatusSkeleton />}>`. */
export async function DbStatus() {
  let counts: ReferenceCounts;
  try {
    counts = await getReferenceCounts();
  } catch (error) {
    // Let Next's own control-flow signals through; handle only real failures.
    unstable_rethrow(error);
    console.error("DB status query failed:", error);
    return (
      <StatusCard
        description={
          <span className="text-destructive">
            Can’t reach the database. Check DATABASE_URL and that PostgreSQL is running.
          </span>
        }
      />
    );
  }

  const checkedAt = new Date().toISOString().slice(11, 19);
  return (
    <StatusCard description={`Live row counts, read at ${checkedAt} UTC`}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {(Object.keys(labels) as (keyof ReferenceCounts)[]).map((key) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground">{labels[key]}</dt>
            <dd className="text-lg font-medium tabular-nums">{counts[key]}</dd>
          </div>
        ))}
      </dl>
    </StatusCard>
  );
}

/** Shipped in the prerendered shell while the counts stream in. */
export function DbStatusSkeleton() {
  return <StatusCard description="Checking…" />;
}

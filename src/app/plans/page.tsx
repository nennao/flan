import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plans" };

// Placeholder: saved plans arrive at M4.
export default function PlansPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  );
}

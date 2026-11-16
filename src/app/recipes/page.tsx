import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recipes" };

// Placeholder: the recipe browser arrives at M2.
export default function RecipesPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  );
}

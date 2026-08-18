import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/workouts/")({
  head: () => ({
    meta: [
      { title: "My Workouts — GymTrack" },
      {
        name: "description",
        content: "Your saved workout routines, ready to start in one tap.",
      },
      { property: "og:title", content: "My Workouts — GymTrack" },
      {
        property: "og:description",
        content: "Your saved workout routines, ready to start in one tap.",
      },
    ],
  }),
  component: Workouts,
});

function Workouts() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/programs", replace: true });
  }, [navigate]);
  return (
    <AppShell title="Programs" subtitle="Taking you to your training space">
      <div className="surface-card animate-pulse p-5 text-sm text-muted-foreground">Loading programs…</div>
    </AppShell>
  );
}

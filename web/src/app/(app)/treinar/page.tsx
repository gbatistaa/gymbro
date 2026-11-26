import type { Metadata } from "next";
import { PlanList } from "@/features/train/plan-list";

export const metadata: Metadata = {
  title: "Workout plans",
};

export default function TrainPage() {
  return <PlanList />;
}

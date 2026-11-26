import type { Metadata } from "next";
import { PlanList } from "@/features/train/plan-list";

export const metadata: Metadata = {
  title: "Treinar",
};

export default function TrainPage() {
  return <PlanList />;
}

import type { Metadata } from "next";
import { RoutineCard } from "@/components/train/routine-card";
import styles from "@/components/train/train.module.css";
import {
  QuickSearchBar,
  TrainTopSection,
} from "@/components/train/train-toolbar";
import { TRAIN_MOCK_DATA } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Treinar",
};

export default function TreinarPage() {
  return (
    <div className={styles.screen}>
      <TrainTopSection data={TRAIN_MOCK_DATA} />

      <ul className={styles.routineList}>
        {TRAIN_MOCK_DATA.routines.map((routine) => (
          <li key={routine.id}>
            <RoutineCard routine={routine} />
          </li>
        ))}
      </ul>

      <QuickSearchBar
        placeholder={TRAIN_MOCK_DATA.quickSearchPlaceholder}
        shortcut={TRAIN_MOCK_DATA.quickSearchShortcut}
      />
    </div>
  );
}

import { z } from "zod";
import {
  bioimpedanceEvolutionSchema,
  exerciseProgressPageSchema,
  exerciseSeriesSchema,
  pinnedExercisesSchema,
  type BioimpedanceEvolution,
  type ExerciseProgressPage,
  type ExerciseProgressSort,
  type ExerciseSeries,
  type PinnedExercise,
  type SortDirection,
} from "@/contracts/progress";
import type { SeriesBucket, TimeRange } from "@/lib/date-ranges";
import { request } from "@/lib/http";

export type ExerciseProgressQuery = {
  search: string;
  muscle: string;
  sort: ExerciseProgressSort;
  direction: SortDirection;
  page: number;
  size: number;
};

export function fetchExerciseProgress(query: ExerciseProgressQuery): Promise<ExerciseProgressPage> {
  return request(
    {
      url: "/api/progress/exercises",
      params: {
        q: query.search || undefined,
        muscle: query.muscle || undefined,
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        size: query.size,
      },
    },
    exerciseProgressPageSchema,
  );
}

export function fetchExerciseSeries(
  exerciseId: string,
  range: TimeRange,
  bucket: SeriesBucket,
): Promise<ExerciseSeries> {
  return request(
    {
      url: `/api/progress/exercises/${exerciseId}/series`,
      params: { from: range.from, to: range.to, bucket },
    },
    exerciseSeriesSchema,
  );
}

export function fetchPinnedExercises(): Promise<PinnedExercise[]> {
  return request({ url: "/api/progress/pinned-exercises" }, pinnedExercisesSchema);
}

/** Substitui a lista inteira de fixados, na ordem dada. */
export function savePinnedExercises(exerciseIds: readonly string[]): Promise<PinnedExercise[]> {
  return request(
    { method: "PUT", url: "/api/progress/pinned-exercises", data: { exerciseIds } },
    pinnedExercisesSchema,
  );
}

export function fetchBioimpedanceEvolution(range: TimeRange): Promise<BioimpedanceEvolution> {
  return request(
    { url: "/api/bioimpedance/evolution", params: { from: range.from, to: range.to } },
    bioimpedanceEvolutionSchema,
  );
}

export function fetchMuscles(): Promise<string[]> {
  return request({ url: "/api/exercises/muscles" }, z.array(z.string()));
}

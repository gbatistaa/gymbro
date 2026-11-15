export type ActiveSessionData = {
  id: string;
  statusLabel: string;
  elapsed: string;
  routineTitle: string;
  completedSetsText: string;
  setBadge: string;
  progressPercent: number;
  volumeLabel: string;
  volumeValue: string;
  volumeUnit: string;
  ctaLabel: string;
  href: string;
};

export type NextWorkoutData = {
  id: string;
  sectionLabel: string;
  routineTitle: string;
  scheduleMeta: string;
  statusBadge: string;
  targetExercise: {
    name: string;
    prescription: string;
    progressionBadge: string;
  };
  ctaLabel: string;
  href: string;
};

export type WeeklyMetricCardData = {
  id: "sessions" | "volume" | "streak" | "weight";
  label: string;
  badgeText?: string;
  trendText?: string;
  value: string;
  unit?: string;
  secondaryValue?: string;
  footer: string;
  hasFlameIcon?: boolean;
  hasSparkline?: boolean;
};

export type WeeklyVolumeBar = {
  id: string;
  weekLabel: string;
  volumeKg: number;
  heightPercent: number;
  variant: "default" | "deload" | "current";
  topTag?: string;
};

export type VolumeChartData = {
  sectionLabel: string;
  title: string;
  averageLabel: string;
  averageValue: string;
  averageUnit: string;
  benchmarkTag: string;
  bars: WeeklyVolumeBar[];
  legend: {
    startLabel: string;
    deloadFirstLabel: string;
    deloadSecondLabel: string;
    currentLabel: string;
  };
};

export type RecentPrItem = {
  id: string;
  exerciseName: string;
  badge: string;
  e1rmLabel: string;
  e1rmValue: string;
  relativeDate: string;
  weight: string;
  repsUnit: string;
};

export type HomeMockData = {
  userInitials: string;
  activeSession: ActiveSessionData;
  nextWorkout: NextWorkoutData;
  weeklyMetricsSectionLabel: string;
  weeklyMetrics: WeeklyMetricCardData[];
  volumeChart: VolumeChartData;
  recentPrsSectionLabel: string;
  recentPrs: RecentPrItem[];
};

export type RoutineExercisePreview = {
  id: string;
  name: string;
  prescription: string;
};

export type RoutineCardData = {
  id: string;
  highlightBadge?: string;
  badgeTone?: "primary" | "neutral";
  lastPerformedLabel: string;
  title: string;
  exerciseCountLabel: string;
  durationLabel: string;
  volumeLabel: string;
  exercises: RoutineExercisePreview[];
  ctaLabel: string;
  href: string;
  isArchived?: boolean;
};

export type TrainMockData = {
  userInitials: string;
  title: string;
  subtitle: string;
  newRoutineLabel: string;
  libraryLabel: string;
  libraryCount: string;
  activeTabLabel: string;
  archivedTabLabel: string;
  adherenceBanner: {
    title: string;
    subtitle: string;
    value: string;
    unit: string;
  };
  routines: RoutineCardData[];
  quickSearchPlaceholder: string;
  quickSearchShortcut: string;
};

export const HOME_MOCK_DATA: HomeMockData = {
  userInitials: "FL",
  activeSession: {
    id: "session-upper-a",
    statusLabel: "Sessão em andamento",
    elapsed: "38:18",
    routineTitle: "Upper A · Força e volume",
    completedSetsText: "8 de 16 séries concluídas",
    setBadge: "Série 8/16",
    progressPercent: 50,
    volumeLabel: "Volume acumulado:",
    volumeValue: "3.420",
    volumeUnit: "kg",
    ctaLabel: "Continuar treino",
    href: "/treinar",
  },
  nextWorkout: {
    id: "routine-lower-b",
    sectionLabel: "PRÓXIMO TREINO",
    routineTitle: "Lower B · Hipertrofia",
    scheduleMeta: "Amanhã · 6 exercícios",
    statusBadge: "Programado",
    targetExercise: {
      name: "Agachamento livre",
      prescription: "100 kg × 8",
      progressionBadge: "+2,5 kg",
    },
    ctaLabel: "Iniciar treino antecipado",
    href: "/treinar",
  },
  weeklyMetricsSectionLabel: "NÚMEROS DA SEMANA",
  weeklyMetrics: [
    {
      id: "sessions",
      label: "Sessões",
      badgeText: "Meta 5",
      value: "4",
      secondaryValue: "/ 5",
      footer: "Falta 1 para a meta",
    },
    {
      id: "volume",
      label: "Volume semanal",
      trendText: "+8%",
      value: "18.450",
      unit: "kg",
      footer: "+1.400 kg vs sem. ant.",
    },
    {
      id: "streak",
      label: "Sequência ativa",
      hasFlameIcon: true,
      value: "6",
      unit: "semanas",
      footer: "Consistência 100%",
    },
    {
      id: "weight",
      label: "Peso corporal",
      trendText: "−0,8 kg",
      value: "81,2",
      unit: "kg",
      hasSparkline: true,
      footer: "Pesado hoje, 07:15",
    },
  ],
  volumeChart: {
    sectionLabel: "VOLUME · 12 SEMANAS",
    title: "Evolução do volume total",
    averageLabel: "Média:",
    averageValue: "16.200",
    averageUnit: "kg/sem",
    benchmarkTag: "16,2k",
    bars: [
      { id: "s1", weekLabel: "S1", volumeKg: 14100, heightPercent: 52, variant: "default" },
      { id: "s2", weekLabel: "S2", volumeKg: 15300, heightPercent: 58, variant: "default" },
      { id: "s3", weekLabel: "S3", volumeKg: 14800, heightPercent: 54, variant: "default" },
      { id: "s4", weekLabel: "S4", volumeKg: 11200, heightPercent: 38, variant: "deload" },
      { id: "s5", weekLabel: "S5", volumeKg: 16200, heightPercent: 64, variant: "default" },
      { id: "s6", weekLabel: "S6", volumeKg: 16900, heightPercent: 68, variant: "default" },
      { id: "s7", weekLabel: "S7", volumeKg: 17400, heightPercent: 72, variant: "default" },
      { id: "s8", weekLabel: "S8", volumeKg: 12000, heightPercent: 42, variant: "deload" },
      { id: "s9", weekLabel: "S9", volumeKg: 17800, heightPercent: 76, variant: "default" },
      { id: "s10", weekLabel: "S10", volumeKg: 18100, heightPercent: 79, variant: "default" },
      { id: "s11", weekLabel: "S11", volumeKg: 17900, heightPercent: 77, variant: "default" },
      {
        id: "s12",
        weekLabel: "S12",
        volumeKg: 18450,
        heightPercent: 82,
        variant: "current",
        topTag: "18,5k",
      },
    ],
    legend: {
      startLabel: "S1",
      deloadFirstLabel: "S4 (Deload)",
      deloadSecondLabel: "S8 (Deload)",
      currentLabel: "S12 (Atual)",
    },
  },
  recentPrsSectionLabel: "RECORDES RECENTES (PRS)",
  recentPrs: [
    {
      id: "pr-bench",
      exerciseName: "Supino reto",
      badge: "PR",
      e1rmLabel: "e-1RM:",
      e1rmValue: "108 kg",
      relativeDate: "há 2 dias",
      weight: "90",
      repsUnit: "kg × 6",
    },
    {
      id: "pr-deadlift",
      exerciseName: "Levantamento terra",
      badge: "PR",
      e1rmLabel: "e-1RM:",
      e1rmValue: "187 kg",
      relativeDate: "há 5 dias",
      weight: "160",
      repsUnit: "kg × 5",
    },
    {
      id: "pr-ohp",
      exerciseName: "Desenvolvimento militar",
      badge: "PR",
      e1rmLabel: "e-1RM:",
      e1rmValue: "72 kg",
      relativeDate: "há 10 dias",
      weight: "62,5",
      repsUnit: "kg × 5",
    },
  ],
};

export const TRAIN_MOCK_DATA: TrainMockData = {
  userInitials: "FL",
  title: "Treinar",
  subtitle: "3 rotinas ativas no seu ciclo atual",
  newRoutineLabel: "Nova rotina",
  libraryLabel: "Biblioteca",
  libraryCount: "142",
  activeTabLabel: "Ativas",
  archivedTabLabel: "Arquivadas (2)",
  adherenceBanner: {
    title: "Frequência: 4x na semana",
    subtitle: "100% de aderência registrada este mês",
    value: "4/4",
    unit: "concluídos",
  },
  routines: [
    {
      id: "routine-upper-a",
      highlightBadge: "Próxima da sequência",
      badgeTone: "primary",
      lastPerformedLabel: "Última: há 3 dias",
      title: "Upper A · Força e volume",
      exerciseCountLabel: "6 exercícios",
      durationLabel: "~55 min",
      volumeLabel: "Vol: 14.200 kg",
      exercises: [
        {
          id: "ex-1",
          name: "Supino reto com barra",
          prescription: "4 séries · 80–90 kg",
        },
        {
          id: "ex-2",
          name: "Puxada alta articulada",
          prescription: "3 séries · 65 kg",
        },
        {
          id: "ex-3",
          name: "Desenvolvimento halter",
          prescription: "3 séries · 24 kg",
        },
      ],
      ctaLabel: "Iniciar treino",
      href: "/treinar",
    },
    {
      id: "routine-lower-b",
      lastPerformedLabel: "Última: há 5 dias",
      title: "Lower B · Hipertrofia",
      exerciseCountLabel: "5 exercícios",
      durationLabel: "~50 min",
      volumeLabel: "Vol: 18.750 kg",
      exercises: [
        {
          id: "ex-4",
          name: "Agachamento livre",
          prescription: "4 séries · 110–120 kg",
        },
        {
          id: "ex-5",
          name: "Leg press 45°",
          prescription: "3 séries · 260 kg",
        },
        {
          id: "ex-6",
          name: "RDL com barra",
          prescription: "3 séries · 95 kg",
        },
      ],
      ctaLabel: "Iniciar treino",
      href: "/treinar",
    },
    {
      id: "routine-push-deload",
      highlightBadge: "Deload",
      badgeTone: "neutral",
      lastPerformedLabel: "Última: há 12 dias",
      title: "Push & Deload · Regenerativo",
      exerciseCountLabel: "4 exercícios",
      durationLabel: "~40 min",
      volumeLabel: "Vol: 7.400 kg",
      exercises: [
        {
          id: "ex-7",
          name: "Supino com halteres",
          prescription: "3 séries · 22 kg",
        },
        {
          id: "ex-8",
          name: "Elevação lateral cabo",
          prescription: "3 séries · 8 kg",
        },
      ],
      ctaLabel: "Iniciar treino",
      href: "/treinar",
    },
  ],
  quickSearchPlaceholder: "Buscar exercício ou carga rápida...",
  quickSearchShortcut: "⌘K",
};

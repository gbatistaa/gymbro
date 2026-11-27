/** Matemática dos gráficos em SVG: escalas, ticks "redondos" e a curva suavizada. */

export type ChartPoint = {
  x: number;
  y: number;
};

export type CubicSegment = {
  control1: ChartPoint;
  control2: ChartPoint;
  end: ChartPoint;
};

export type ValueDomain = {
  min: number;
  max: number;
  ticks: number[];
};

const DEFAULT_TICK_COUNT = 5;

/** Função linear de `domain` para `range`. Domínio de um valor só cai no meio do range. */
export function scaleLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) {
    const middle = (r0 + r1) / 2;
    return () => middle;
  }
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Arredonda para 1, 2, 5 ou 10 vezes uma potência de 10 (Heckbert, "Nice numbers for graph labels"). */
function niceNumber(value: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let nice: number;
  if (round) {
    nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return nice * 10 ** exponent;
}

function decimalsOf(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step)));
}

/** Ticks com passo redondo que cobrem `[min, max]`; um valor único ganha uma janela em volta. */
export function niceTicks(min: number, max: number, count: number = DEFAULT_TICK_COUNT): number[] {
  let low = Math.min(min, max);
  let high = Math.max(min, max);
  if (low === high) {
    const padding = Math.abs(low) * 0.05 || 1;
    low -= padding;
    high += padding;
  }

  const range = niceNumber(high - low, false);
  const step = niceNumber(range / Math.max(1, count - 1), true);
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;
  const decimals = decimalsOf(step);

  const ticks: number[] = [];
  for (let index = 0; start + index * step <= end + step / 2; index++) {
    ticks.push(Number((start + index * step).toFixed(decimals)));
  }
  return ticks;
}

/** Domínio do eixo Y a partir dos valores: vai do primeiro ao último tick. */
export function valueDomain(values: readonly number[], tickCount: number = DEFAULT_TICK_COUNT): ValueDomain {
  if (values.length === 0) {
    return { min: 0, max: 1, ticks: [0, 1] };
  }
  const ticks = niceTicks(Math.min(...values), Math.max(...values), tickCount);
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks };
}

function slopes(points: readonly ChartPoint[]): number[] {
  const result: number[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const dx = points[index + 1].x - points[index].x;
    result.push(dx > 0 ? (points[index + 1].y - points[index].y) / dx : 0);
  }
  return result;
}

/**
 * Tangentes de Fritsch–Carlson: a curva passa por todos os pontos e não ultrapassa os vizinhos,
 * então não inventa um pico ou um vale que não existe nos dados.
 */
function monotoneTangents(points: readonly ChartPoint[]): number[] {
  const secants = slopes(points);
  const last = points.length - 1;
  const tangents = points.map((_, index) => {
    if (index === 0) return secants[0];
    if (index === last) return secants[last - 1];
    const before = secants[index - 1];
    const after = secants[index];
    return before * after <= 0 ? 0 : (before + after) / 2;
  });

  for (let index = 0; index < last; index++) {
    const secant = secants[index];
    if (secant === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const alpha = tangents[index] / secant;
    const beta = tangents[index + 1] / secant;
    const magnitude = alpha * alpha + beta * beta;
    if (magnitude > 9) {
      const factor = 3 / Math.sqrt(magnitude);
      tangents[index] = factor * alpha * secant;
      tangents[index + 1] = factor * beta * secant;
    }
  }
  return tangents;
}

/** Segmentos cúbicos de Bézier da curva monotônica (pontos ordenados por x). */
export function monotoneSegments(points: readonly ChartPoint[]): CubicSegment[] {
  if (points.length < 2) return [];
  const tangents = monotoneTangents(points);

  return points.slice(1).map((end, offset) => {
    const start = points[offset];
    const third = (end.x - start.x) / 3;
    return {
      control1: { x: start.x + third, y: start.y + tangents[offset] * third },
      control2: { x: end.x - third, y: end.y - tangents[offset + 1] * third },
      end,
    };
  });
}

function coordinate(point: ChartPoint): string {
  return `${round(point.x)},${round(point.y)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Atributo `d` da linha suavizada. */
export function monotonePath(points: readonly ChartPoint[]): string {
  if (points.length === 0) return "";
  const segments = monotoneSegments(points)
    .map(({ control1, control2, end }) =>
      `C${coordinate(control1)},${coordinate(control2)},${coordinate(end)}`)
    .join("");
  return `M${coordinate(points[0])}${segments}`;
}

/** Atributo `d` da área sob a linha suavizada, fechada na linha de base. */
export function monotoneAreaPath(points: readonly ChartPoint[], baselineY: number): string {
  if (points.length < 2) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${monotonePath(points)}L${round(last.x)},${round(baselineY)}L${round(first.x)},${round(baselineY)}Z`;
}

/** Índice do x mais próximo numa lista ordenada; -1 sem dados. */
export function nearestIndex(xs: readonly number[], x: number): number {
  if (xs.length === 0) return -1;
  let low = 0;
  let high = xs.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (xs[middle] <= x) low = middle;
    else high = middle;
  }
  return Math.abs(xs[low] - x) <= Math.abs(xs[high] - x) ? low : high;
}

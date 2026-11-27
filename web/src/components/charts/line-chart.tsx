"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  monotoneAreaPath,
  monotonePath,
  nearestIndex,
  scaleLinear,
  valueDomain,
  type ChartPoint,
} from "@/lib/chart-math";
import { useElementWidth } from "@/lib/use-element-width";
import styles from "./charts.module.css";

/** Um ponto da série: `x` em milissegundos desde a época, `y` no valor da métrica. */
export type LineChartDatum = ChartPoint;

type LineChartProps = {
  data: readonly LineChartDatum[];
  /** Nome da série: rótulo acessível e cabeçalho da tabela para leitores de tela. */
  label: string;
  /** Período do eixo X (ms). Sem ele, vai do primeiro ao último ponto. */
  xDomain?: readonly [number, number];
  formatValue: (value: number) => string;
  /** Rótulo curto dos ticks do eixo Y. */
  formatTick: (value: number) => string;
  /** Data por extenso, no tooltip e na tabela. */
  formatDate: (x: number) => string;
  /** Data curta, nas pontas do eixo X. */
  formatAxisDate: (x: number) => string;
  height?: number;
  /** Sem eixos: para cartões pequenos, onde o número em destaque já dá a escala. */
  compact?: boolean;
  emptyLabel?: string;
};

type Margin = { top: number; right: number; bottom: number; left: number };

const FULL_MARGIN: Margin = { top: 14, right: 14, bottom: 28, left: 48 };
const COMPACT_MARGIN: Margin = { top: 10, right: 8, bottom: 8, left: 8 };
/** Acima disso os marcadores viram ruído; fica só o último ponto marcado. */
const MAX_MARKED_POINTS = 31;
const TOOLTIP_HALF_WIDTH = 72;

function xExtent(data: readonly LineChartDatum[], xDomain?: readonly [number, number]): [number, number] {
  const xs = data.map((datum) => datum.x);
  const dataMin = xs.length > 0 ? Math.min(...xs) : 0;
  const dataMax = xs.length > 0 ? Math.max(...xs) : 1;
  if (!xDomain) return [dataMin, dataMax];
  // um bucket de semana ou mês pode começar antes do período pedido
  return [Math.min(xDomain[0], dataMin), Math.max(xDomain[1], dataMax)];
}

export function LineChart({
  data,
  label,
  xDomain,
  formatValue,
  formatTick,
  formatDate,
  formatAxisDate,
  height = 220,
  compact = false,
  emptyLabel = "Sem registros no período.",
}: LineChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // `useId` traz ":" no valor, que não serve dentro de `url(#…)`
  const gradientId = `area-${useId().replace(/:/g, "")}`;

  const margin = compact ? COMPACT_MARGIN : FULL_MARGIN;
  const plotLeft = margin.left;
  const plotRight = Math.max(plotLeft, width - margin.right);
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;

  const domain = valueDomain(data.map((datum) => datum.y), compact ? 3 : 4);
  const [x0, x1] = xExtent(data, xDomain);
  const toX = scaleLinear([x0, x1], [plotLeft, plotRight]);
  const toY = scaleLinear([domain.min, domain.max], [plotBottom, plotTop]);
  const screen = data.map((datum) => ({ x: toX(datum.x), y: toY(datum.y) }));
  const screenXs = screen.map((point) => point.x);

  const active = activeIndex !== null && activeIndex < data.length ? activeIndex : null;
  const showAllMarkers = data.length <= MAX_MARKED_POINTS;

  function handlePointer(event: PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds) return;
    const index = nearestIndex(screenXs, event.clientX - bounds.left);
    setActiveIndex(index >= 0 ? index : null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (data.length === 0) return;
    const last = data.length - 1;
    const current = active ?? last;
    const next =
      event.key === "ArrowLeft" ? Math.max(0, current - 1)
        : event.key === "ArrowRight" ? Math.min(last, current + 1)
          : event.key === "Home" ? 0
            : event.key === "End" ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty} style={{ height }} role="status">
        {emptyLabel}
      </div>
    );
  }

  const tooltipLeft =
    active === null
      ? 0
      : Math.min(Math.max(screen[active].x, TOOLTIP_HALF_WIDTH), Math.max(TOOLTIP_HALF_WIDTH, width - TOOLTIP_HALF_WIDTH));

  return (
    <div
      ref={containerRef}
      className={styles.chart}
      style={{ height }}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use as setas para percorrer os pontos.`}
      onKeyDown={handleKeyDown}
      onBlur={() => setActiveIndex(null)}
    >
      {width > 0 ? (
        <svg className={styles.svg} width={width} height={height} aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop className={styles.gradientTop} offset="0" />
              <stop className={styles.gradientBottom} offset="1" />
            </linearGradient>
          </defs>
          {compact
            ? null
            : domain.ticks.map((tick) => (
                <g key={tick}>
                  <line
                    className={styles.gridLine}
                    x1={plotLeft}
                    x2={plotRight}
                    y1={toY(tick)}
                    y2={toY(tick)}
                  />
                  <text className={styles.tickLabel} x={plotLeft - 8} y={toY(tick)}>
                    {formatTick(tick)}
                  </text>
                </g>
              ))}

          {compact ? null : (
            <>
              <text className={styles.axisLabelStart} x={plotLeft} y={height - 8}>
                {formatAxisDate(x0)}
              </text>
              <text className={styles.axisLabelEnd} x={plotRight} y={height - 8}>
                {formatAxisDate(x1)}
              </text>
            </>
          )}

          {screen.length > 1 ? (
            <>
              <path
                className={styles.area}
                fill={`url(#${gradientId})`}
                d={monotoneAreaPath(screen, plotBottom)}
              />
              <path className={styles.line} d={monotonePath(screen)} />
            </>
          ) : null}

          {screen.map((point, index) =>
            showAllMarkers || index === screen.length - 1 ? (
              <circle key={index} className={styles.marker} cx={point.x} cy={point.y} r={3.5} />
            ) : null,
          )}

          {active !== null ? (
            <>
              <line
                className={styles.crosshair}
                x1={screen[active].x}
                x2={screen[active].x}
                y1={plotTop}
                y2={plotBottom}
              />
              <circle className={styles.markerActive} cx={screen[active].x} cy={screen[active].y} r={5.5} />
            </>
          ) : null}

          <rect
            className={styles.hitArea}
            x={0}
            y={0}
            width={width}
            height={height}
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerLeave={() => setActiveIndex(null)}
          />
        </svg>
      ) : null}

      {active !== null ? (
        <div className={styles.tooltip} style={{ left: tooltipLeft }} aria-hidden="true">
          <strong className={styles.tooltipValue}>{formatValue(data[active].y)}</strong>
          <span className={styles.tooltipDate}>{formatDate(data[active].x)}</span>
        </div>
      ) : null}

      <table className={styles.srOnly}>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum, index) => (
            <tr key={`${datum.x}-${index}`}>
              <td>{formatDate(datum.x)}</td>
              <td>{formatValue(datum.y)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

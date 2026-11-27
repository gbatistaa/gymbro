"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

/**
 * Largura atual de um elemento, acompanhada com `ResizeObserver`. Começa em 0 até a primeira
 * medição (no servidor e no primeiro render do cliente).
 */
export function useElementWidth<T extends HTMLElement>(): [RefCallback<T>, number] {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [ref, width];
}

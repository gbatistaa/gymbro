import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const BAR_COUNT = 3;

type LoadingBarsProps = {
  color?: string;
  height?: number;
};

/**
 * O único loading do sistema: três barras pulsando em opacidade 0.4 → 0.8. Nunca spinner circular.
 *
 * Com "reduzir movimento" ativo as barras ficam paradas em 0.6 — o estado continua legível sem
 * animação. `shortcut: lê o ajuste no mount; mudança em runtime só vale no próximo mount`.
 */
export function LoadingBars({ color = Colors.dark.rule, height = 16 }: LoadingBarsProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const values = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.4)),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) {
        setReduceMotion(enabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      values.forEach((value) => value.setValue(0.6));
      return;
    }

    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, { toValue: 0.8, duration: 400, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [reduceMotion, values]);

  return (
    <View
      accessibilityRole="progressbar"
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={{ width: Spacing.one, height, backgroundColor: color, opacity: value }}
        />
      ))}
    </View>
  );
}

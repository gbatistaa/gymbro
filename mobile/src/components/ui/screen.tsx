import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cx } from '@/lib/cx';

type ScreenProps = ViewProps & {
  /** Bordas da safe area a respeitar. Padrão: só a inferior, porque a navegação cuida do topo. */
  edges?: readonly Edge[];
};

/**
 * Contêiner de tela: gutter de 20 (`px-5`) e conteúdo parado em 640 no web.
 *
 * `className` e `style` se aplicam à área de conteúdo, não à safe area — padding de tela vem
 * daqui, nunca de cada tela.
 */
export function Screen({ children, edges = ['bottom'], className, style, ...rest }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-canvas" {...rest}>
      <View className={cx('w-full flex-1 max-w-[640px] self-center px-5', className)} style={style}>
        {children}
      </View>
    </SafeAreaView>
  );
}

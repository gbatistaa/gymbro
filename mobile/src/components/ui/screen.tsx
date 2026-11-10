import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Gutter, MaxContentWidth } from '@/constants/theme';

type ScreenProps = ViewProps & {
  /** Bordas da safe area a respeitar. Padrão: só a inferior, porque a navegação cuida do topo. */
  edges?: readonly Edge[];
};

/**
 * Contêiner de tela: gutter de 20 e borda esquerda alinhada em todas as telas.
 *
 * `style` se aplica à área de conteúdo, não à safe area — padding de tela vem daqui, nunca de
 * cada tela.
 */
export function Screen({ children, style, className, edges = ['bottom'], ...rest }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-canvas ${className ?? ''}`} {...rest}>
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
            paddingHorizontal: Gutter,
          },
          style,
        ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

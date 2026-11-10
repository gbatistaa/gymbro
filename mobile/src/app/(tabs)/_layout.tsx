import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';
import { useAtomValue } from 'jotai';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { sessionAtom } from '@/lib/auth/session';

type FeatherName = keyof typeof Feather.glyphMap;

const ICON_SIZE = 20;

/**
 * Ícone da aba com o indicador de 2px da ativa.
 *
 * O indicador vive dentro do slot do ícone porque a tab bar nativa do React Navigation não expõe
 * uma faixa de destaque: desenhar aqui evita reimplementar a tab bar inteira (e perder safe area,
 * acessibilidade e gesto) só por causa disso.
 */
function TabIcon({
  name,
  focused,
  color,
}: {
  name: FeatherName;
  focused: boolean;
  color: ColorValue;
}) {
  // o tint vem tipado como ColorValue (pode ser nulo); o Feather só aceita string
  const tint = typeof color === 'string' ? color : Colors.dark.textMuted;

  return (
    <View style={styles.iconSlot}>
      <Feather name={name} size={ICON_SIZE} color={tint} />
      {focused ? <View style={styles.indicator} /> : null}
    </View>
  );
}

/**
 * Quatro abas, ícone Feather, sem rótulo de texto.
 *
 * `tabBarAccessibilityLabel` é obrigatório aqui: sem rótulo visível, o leitor de tela anunciaria
 * apenas "botão".
 */
export default function TabsLayout() {
  // sem sessão não há o que mostrar: a guarda fica aqui, não em cada tela
  const session = useAtomValue(sessionAtom);
  if (session === null) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarAccessibilityLabel: 'Início',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Treinar',
          tabBarAccessibilityLabel: 'Treinar',
          tabBarIcon: ({ focused, color }) => <TabIcon name="play" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarAccessibilityLabel: 'Progresso',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="trending-up" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ focused, color }) => <TabIcon name="user" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // régua no topo, não sombra: a hierarquia do app vem de degrau de superfície e de hairline
  tabBar: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.dark.rule,
  },
  iconSlot: {
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -Spacing.two,
    width: 16,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.dark.accent,
  },
});

import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Toaster } from 'sonner-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors, FontFamily, Radius } from '@/constants/theme';
import { getSessionRestorer } from '@/lib/api';

// precisa ser chamado no escopo do módulo, antes do primeiro render
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // runtime em vez do config plugin do expo-font: o plugin embute a fonte no build nativo e exige
  // prebuild; useFonts funciona também em Expo Go e na web. Upgrade quando houver build de release.
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) {
        setSessionRestored(true);
      }
    };

    // `getSessionRestorer()` pode lançar de forma síncrona (EXPO_PUBLIC_API_URL ausente). Sem o
    // try, a exceção escaparia antes do .catch, `sessionRestored` nunca viraria true e o app
    // ficaria em branco para sempre — indistinguível de "a tela não tem botão".
    try {
      void getSessionRestorer()()
        .catch(() => {})
        .finally(finish);
    } catch {
      finish();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // esconder também no erro: abrir com fonte de fallback é melhor que ficar preso no splash
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if ((!fontsLoaded && !fontError) || !sessionRestored) {
    return null;
  }

  // obrigatório para o sonner-native: o swipe do toast usa GestureDetector e, fora de um
  // GestureHandlerRootView, lança exceção no primeiro toast (submit com erro de validação).
  // `style` e não `className`: o GestureHandlerRootView não está no interop do NativeWind.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.dark.canvas },
          }}
        />

        {/* topo da tela e paleta do sistema: erro é aviso, não bloco de texto dentro do formulário */}
        <Toaster
          position="top-center"
          theme="dark"
          duration={4000}
          offset={16}
          styles={{
            toast: {
              backgroundColor: Colors.dark.surface,
              borderColor: Colors.dark.rule,
              borderWidth: 1,
              borderRadius: Radius.control,
            },
            title: { color: Colors.dark.textPrimary, fontFamily: FontFamily.sans, fontSize: 16 },
            description: {
              color: Colors.dark.textSecondary,
              fontFamily: FontFamily.sans,
              fontSize: 13,
            },
          }}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

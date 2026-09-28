import '@/i18n';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold, useFonts } from '@expo-google-fonts/onest';
import { ThemeProvider } from '@shopify/restyle';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { theme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider theme={theme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.ground } }}>
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals-edit" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

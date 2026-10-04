import '@/i18n';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { ThemeProvider } from '@shopify/restyle';
import { Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAppearance, useSeasonIconSync } from '@/lib/appearance';
import { useEveningCheckIn, useNotificationTaps, usePlanReminders, useWeekNudge } from '@/lib/notifications';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { theme, mode } = useAppearance();
  useSeasonIconSync();
  useWeekNudge();
  useEveningCheckIn();
  usePlanReminders();
  // Routing from a notification needs the navigator itself, not only the first render.
  const navReady = Boolean(useRootNavigationState()?.key);
  useNotificationTaps(fontsLoaded && navReady);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider theme={theme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.ground } }}>
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="plan-week" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="asset-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="avatar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="emoji" options={{ presentation: 'modal' }} />
        <Stack.Screen name="language" options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, contentStyle: { backgroundColor: theme.colors.ground } }} />
        <Stack.Screen name="congrats" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="share-week" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

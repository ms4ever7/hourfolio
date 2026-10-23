import '@/i18n';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { ThemeProvider } from '@shopify/restyle';
import { Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAppearance, useSeasonIconSync } from '@/lib/appearance';
import { useBadgeSync } from '@/lib/badges';
import { useGoalHistorySync } from '@/lib/goal-history';
import { useEveningCheckIn, useNotificationTaps, usePlanReminders, useWeekNudge } from '@/lib/notifications';

void SplashScreen.preventAutoHideAsync();

/** A link straight to a modal (`hourfolio://log`) still gets the tabs underneath, so closing it has somewhere to go. */
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { theme, mode } = useAppearance();
  useSeasonIconSync();
  useGoalHistorySync();
  useBadgeSync();
  useWeekNudge();
  useEveningCheckIn();
  usePlanReminders();
  // Routing from a notification needs the navigator itself, not only the first render.
  const navReady = Boolean(useRootNavigationState()?.key);
  // A font that fails to load must not leave the splash screen up for good; the system font steps in.
  const ready = fontsLoaded || fontError !== null;
  useNotificationTaps(ready && navReady);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider theme={theme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.ground } }}>
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="plan-week" options={{ presentation: 'modal' }} />
        <Stack.Screen name="today" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="asset-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="avatar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="emoji" options={{ presentation: 'modal' }} />
        <Stack.Screen name="language" options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, contentStyle: { backgroundColor: theme.colors.ground } }} />
        <Stack.Screen name="congrats" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="share-week" options={{ presentation: 'modal' }} />
        <Stack.Screen name="week" options={{ presentation: 'modal' }} />
        <Stack.Screen name="badge" options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, contentStyle: { backgroundColor: theme.colors.ground } }} />
      </Stack>
    </ThemeProvider>
  );
}

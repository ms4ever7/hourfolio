import { Stack } from 'expo-router';
import { theme } from '@/theme/theme';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.ground } }} />;
}

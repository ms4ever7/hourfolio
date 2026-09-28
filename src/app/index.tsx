import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settings-store';

export default function Index() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}

import { Redirect, router } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { withAlpha } from '@/domain/color';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

const TAB_ICONS: Record<string, string> = {
  index: UI_PATHS.portfolio,
  analytics: UI_PATHS.analytics,
  goals: UI_PATHS.target,
  profile: UI_PATHS.user,
};

function TabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const tab = (index: number) => {
    const route = state.routes[index];
    const focused = state.index === index;
    const label = descriptors[route.key].options.title ?? route.name;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 }}
      >
        <Glyph d={TAB_ICONS[route.name]} size={24} color={focused ? colors.ink : colors.muted} />
        <Text variant="tiny" color={focused ? 'ink' : 'muted'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontFamily: focused ? 'Onest_600SemiBold' : 'Onest_500Medium' }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Box flexDirection="row" alignItems="center" backgroundColor="card" borderTopWidth={1} borderColor="track" paddingHorizontal="s" style={{ paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) }}>
      {tab(0)}
      {tab(1)}
      <Box flex={1} alignItems="center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.invest')}
          onPress={() => router.push('/log')}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${withAlpha(colors.accent, 0.3)}`,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Glyph d={UI_PATHS.plus} size={26} color={colors.onAccent} strokeWidth={2.2} />
        </Pressable>
      </Box>
      {tab(2)}
      {tab(3)}
    </Box>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const onboarded = useSettingsStore((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('tabs.portfolio') }} />
      <Tabs.Screen name="analytics" options={{ title: t('tabs.analytics') }} />
      <Tabs.Screen name="goals" options={{ title: t('tabs.goals') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

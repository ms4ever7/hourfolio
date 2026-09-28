import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, TextInput } from 'react-native';
import { ProfileAvatar } from '@/components/avatar';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Group, ListRow, Screen, SwitchRow } from '@/components/ui';
import { formatHours } from '@/domain/format';
import { capitalMinutes } from '@/domain/growth';
import { canChangeIcon, useAppIcon, useSeason } from '@/lib/appearance';
import { allowNotifications, useTestNudge } from '@/lib/notifications';
import { usePortfolio } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { assets, logs } = usePortfolio();
  const s = useSettingsStore();
  const loadDemo = usePortfolioStore((st) => st.loadDemo);
  const reset = usePortfolioStore((st) => st.reset);
  const season = useSeason();
  const [icon, setIcon] = useAppIcon();
  const testNudge = useTestNudge();

  const capital = assets.reduce((sum, a) => sum + capitalMinutes(a, logs), 0);
  const modeLabel = t(`appearance.${s.themeMode}`);
  const offerIcon = season && canChangeIcon && icon !== season.icon;

  const confirm = (action: () => void) =>
    Alert.alert(t('settings.confirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.continue'), style: 'destructive', onPress: action },
    ]);

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('profile.title')}
      </Text>

      <Box alignItems="center" gap="sm">
        <Pressable accessibilityRole="button" accessibilityLabel={t('profile.changeAvatar')} onPress={() => router.push('/avatar')} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <ProfileAvatar avatar={s.avatar} size={104} />
          <Box position="absolute" width={34} height={34} borderRadius="pill" backgroundColor="accent" alignItems="center" justifyContent="center" style={{ right: -6, bottom: -6, borderWidth: 3, borderColor: colors.ground }}>
            <Glyph d={UI_PATHS.pencil} size={15} color={colors.onAccent} strokeWidth={2.2} />
          </Box>
        </Pressable>
        <TextInput
          value={s.name}
          onChangeText={s.setName}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor={colors.faint}
          accessibilityLabel={t('profile.nameLabel')}
          textAlign="center"
          returnKeyType="done"
          maxLength={40}
          style={{ minWidth: 200, fontFamily: 'Onest_700Bold', fontSize: 24, color: colors.ink, paddingVertical: 4 }}
        />
        <Text variant="caption">{t('profile.summary', { hours: formatHours(capital, i18n.language), count: assets.length })}</Text>
      </Box>

      {season ? (
        <Box flexDirection="row" alignItems="center" gap="sm" backgroundColor="accentSoft" borderRadius="l" padding="sm">
          <Text style={{ fontSize: 28, lineHeight: 34 }}>{season.decor}</Text>
          <Box flex={1} gap="xs">
            <Text variant="bodyStrong">{t('profile.seasonOn', { season: t(`seasons.${season.id}`) })}</Text>
            {offerIcon ? (
              <Pressable accessibilityRole="button" onPress={() => void setIcon(season.icon)} hitSlop={8}>
                <Text variant="label" color="accentInk" style={{ fontFamily: 'Onest_600SemiBold' }}>
                  {t('profile.seasonIcon')}
                </Text>
              </Pressable>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Group>
        <ListRow
          title={t('profile.appearance')}
          value={modeLabel}
          left={<Box width={22} height={22} borderRadius="pill" backgroundColor="accent" style={{ borderWidth: 2, borderColor: colors.accentSoft }} />}
          onPress={() => router.push('/appearance')}
        />
        <ListRow
          title={t('profile.language')}
          value={t(`languages.${s.language}`)}
          left={<Glyph d={UI_PATHS.globe} size={22} color={colors.ink} />}
          onPress={() => router.push('/language')}
          last
        />
      </Group>

      <Group title={t('profile.notifications')}>
        <SwitchRow
          title={t('profile.nudges')}
          sub={t('profile.nudgesSub')}
          value={s.nudges}
          onChange={async (on) => {
            if (on && !(await allowNotifications())) {
              Alert.alert(t('profile.nudgesDenied'));
              return;
            }
            s.setNudges(on);
          }}
          last={!__DEV__}
        />
        {__DEV__ ? (
          // Development builds only, so the reminder can be checked without waiting for Sunday.
          <ListRow
            title="Send the reminder in 10 s"
            sub="Dev only. Uses this week's data; lock the phone to see the banner."
            onPress={async () => {
              if (!(await allowNotifications())) {
                Alert.alert(t('profile.nudgesDenied'));
                return;
              }
              const sent = await testNudge();
              Alert.alert(
                sent === 'real' ? 'Reminder in 10 s' : sent === 'sample' ? 'Sample reminder in 10 s' : 'Add an asset first',
                sent === 'sample' ? 'No weekly goal is nearly met right now, so this is a sample with 25 min left. Lock the phone to see it.' : sent ? 'Lock the phone to see it.' : undefined,
              );
            }}
            last
          />
        ) : null}
      </Group>

      <Group title={t('profile.portfolio')}>
        <ListRow title={t('pick.custom')} sub={t('custom.label')} onPress={() => router.push({ pathname: '/onboarding/custom', params: { mode: 'add' } })} />
        <ListRow title={t('settings.demo')} sub={t('settings.demoSub')} onPress={() => confirm(loadDemo)} />
        <ListRow
          danger
          last
          title={t('settings.reset')}
          sub={t('settings.resetSub')}
          onPress={() =>
            confirm(() => {
              reset();
              s.setOnboarded(false);
              router.replace('/onboarding');
            })
          }
        />
      </Group>
    </Screen>
  );
}

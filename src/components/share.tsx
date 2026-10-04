import * as Sharing from 'expo-sharing';
import type { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelRatio, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { formatHours } from '@/domain/format';
import type { SceneId } from '@/domain/goals';
import type { SeasonId } from '@/domain/seasons';
import type { Asset } from '@/domain/types';
import { useAssetName } from '@/lib/labels';
import { lightPalette } from '@/theme/theme';
import { AssetIcon, BrandMark } from './icons';
import { Box, Text } from './primitives';
import { GoalScene } from './scenes';

/** Share cards are always drawn the same way, whatever the app theme, so they look right anywhere they are posted. */
const CARD = { bg: '#15171A', ink: '#FFFFFF', muted: '#B9BCC2', faint: '#8A8F96', hours: '#9DB0FF', line: 'rgba(255,255,255,0.12)' };
export const CARD_WIDTH = 320;
const CARD_HEIGHT = 400;
const OUTPUT_PX = 1080;

/** Renders the view to a PNG and opens the share sheet (Telegram, Threads, Instagram…). */
export async function shareView(ref: RefObject<View | null>): Promise<boolean> {
  if (!ref.current || !(await Sharing.isAvailableAsync())) return false;
  const width = OUTPUT_PX / PixelRatio.get();
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width, height: (width * CARD_HEIGHT) / CARD_WIDTH });
  await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
  return true;
}

function CardFrame({ glow, children, cardRef }: { glow: string; children: ReactNode; cardRef: RefObject<View | null> }) {
  return (
    <View ref={cardRef} collapsable={false} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, overflow: 'hidden', backgroundColor: CARD.bg }}>
      <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="glow" cx="0.85" cy="0.1" r="0.9">
            <Stop offset="0" stopColor={glow} stopOpacity={0.55} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#glow)" />
        <Circle cx={CARD_WIDTH - 30} cy={CARD_HEIGHT - 20} r={90} fill={glow} fillOpacity={0.08} />
      </Svg>
      <Box flex={1} padding="l" justifyContent="space-between">
        {children}
      </Box>
    </View>
  );
}

function CardHeader({ right }: { right: string }) {
  return (
    <Box flexDirection="row" alignItems="center" gap="s">
      <BrandMark size={22} />
      <Text style={{ flex: 1, color: CARD.ink, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Hourfolio</Text>
      <Text style={{ color: CARD.muted, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{right}</Text>
    </Box>
  );
}

function BigHours({ minutes, size = 56 }: { minutes: number; size?: number }) {
  const { t, i18n } = useTranslation();
  return (
    <Text style={{ color: CARD.ink, fontFamily: 'Inter_600SemiBold', fontSize: size, lineHeight: size * 1.08, letterSpacing: -1.5 }}>
      {formatHours(minutes, i18n.language)}
      <Text style={{ color: CARD.hours, fontFamily: 'Inter_600SemiBold', fontSize: size * 0.4 }}> {t('units.h')}</Text>
    </Text>
  );
}

export function GoalCard({
  cardRef,
  asset,
  minutes,
  goal,
  weekLabel,
  scene,
  season,
}: {
  cardRef: RefObject<View | null>;
  asset: Asset;
  minutes: number;
  goal: number;
  weekLabel: string;
  scene: SceneId;
  season: SeasonId | null;
}) {
  const { t, i18n } = useTranslation();
  const assetName = useAssetName();
  const p = lightPalette[asset.color];
  return (
    <CardFrame glow={p.main} cardRef={cardRef}>
      <CardHeader right={weekLabel} />
      <Box gap="sm">
        <Box flexDirection="row" alignItems="center" gap="sm">
          <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={52} />
          <Box flex={1}>
            <Text style={{ color: CARD.ink, fontFamily: 'Inter_700Bold', fontSize: 20 }} numberOfLines={1}>
              {assetName(asset)}
            </Text>
            <Text style={{ color: p.soft, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{t('congrats.cardGoal')}</Text>
          </Box>
        </Box>
        <BigHours minutes={minutes} />
        <Text style={{ color: CARD.muted, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{t('congrats.cardOf', { goal: formatHours(goal, i18n.language) })}</Text>
      </Box>
      <Box gap="m">
        <GoalScene scene={scene === 'bar' ? 'dog' : scene} progress={1} color={p.main} tint={CARD.line} season={season} height={54} />
        <Text style={{ color: CARD.faint, fontFamily: 'Inter_500Medium', fontSize: 11 }}>{t('share.tagline')}</Text>
      </Box>
    </CardFrame>
  );
}

export interface WeekRow {
  asset: Asset;
  minutes: number;
}

export function WeekCard({
  cardRef,
  total,
  rows,
  weekLabel,
  goalsMet,
  goalsTotal,
  accent,
}: {
  cardRef: RefObject<View | null>;
  total: number;
  rows: WeekRow[];
  weekLabel: string;
  goalsMet: number;
  goalsTotal: number;
  accent: string;
}) {
  const { t, i18n } = useTranslation();
  const assetName = useAssetName();
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <CardFrame glow={accent} cardRef={cardRef}>
      <CardHeader right={weekLabel} />
      <Box gap="xs">
        <Text style={{ color: CARD.muted, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{t('share.invested')}</Text>
        <BigHours minutes={total} />
        {goalsTotal > 0 ? (
          <Text style={{ color: CARD.muted, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{t('share.goalsMet', { met: goalsMet, count: goalsTotal })}</Text>
        ) : null}
      </Box>
      <Box gap="sm">
        {rows.map((r) => {
          const p = lightPalette[r.asset.color];
          return (
            <Box key={r.asset.id} flexDirection="row" alignItems="center" gap="sm">
              <AssetIcon icon={r.asset.icon} color={r.asset.color} face={r.asset.face} size={30} />
              <Box flex={1} gap="xs">
                <Box flexDirection="row" justifyContent="space-between">
                  <Text style={{ color: CARD.ink, fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {assetName(r.asset)}
                  </Text>
                  <Text style={{ color: CARD.ink, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                    {formatHours(r.minutes, i18n.language)}
                    <Text style={{ color: CARD.hours, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}> {t('units.h')}</Text>
                  </Text>
                </Box>
                <Box height={4} borderRadius="pill" style={{ backgroundColor: CARD.line }}>
                  <Box height={4} borderRadius="pill" style={{ width: `${Math.max(4, (r.minutes / max) * 100)}%`, backgroundColor: p.main }} />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Text style={{ color: CARD.faint, fontFamily: 'Inter_500Medium', fontSize: 11 }}>{t('share.tagline')}</Text>
    </CardFrame>
  );
}

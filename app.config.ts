import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` holds the app; this file only changes what differs per build
 * profile. `APP_VARIANT` comes from `eas.json`. Staging installs next to
 * production (own bundle id, name and URL scheme). The team id in `app.json` is
 * the free personal team used for local builds; cloud builds sign with the paid
 * team that EAS reads from the Apple login, so it is left out there.
 */
const VARIANT = process.env.APP_VARIANT ?? 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (VARIANT === 'development') return base;
  const cloud = { ...base, ios: { ...base.ios, appleTeamId: undefined } };
  if (VARIANT !== 'staging') return cloud;
  return {
    ...cloud,
    name: `${base.name} Stg`,
    scheme: `${base.scheme}-stg`,
    ios: { ...cloud.ios, bundleIdentifier: `${base.ios?.bundleIdentifier}.stg` },
    android: { ...base.android, package: `${base.android?.package}.stg` },
  };
};

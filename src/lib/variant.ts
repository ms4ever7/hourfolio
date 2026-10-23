import Constants from 'expo-constants';

/** Build profile (`APP_VARIANT` from eas.json, passed through `extra` in app.config.ts). A release build without one is treated as production. */
export const VARIANT: string = (Constants.expoConfig?.extra?.variant as string | undefined) ?? (__DEV__ ? 'development' : 'production');

/** Tester-only tools, like loading sample data. Only in development and staging, never by default. */
export const SHOW_TEST_TOOLS = VARIANT === 'development' || VARIANT === 'staging';

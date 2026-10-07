import Constants from 'expo-constants';

/** Build profile (`APP_VARIANT` from eas.json, passed through `extra` in app.config.ts). */
export const VARIANT: string = (Constants.expoConfig?.extra?.variant as string | undefined) ?? 'development';

/** Tester-only tools, like loading sample data. Hidden in production. */
export const SHOW_TEST_TOOLS = VARIANT !== 'production';

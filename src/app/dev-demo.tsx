import { Redirect } from 'expo-router';
import { useState } from 'react';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Dev-only deep link (`hourfolio://dev-demo`) that loads sample data without the
 * confirmation alert, for e2e flows. Does nothing in release builds.
 */
export default function DevDemo() {
  // Runs once, before the redirect renders, so the index sees onboarded = true.
  useState(() => {
    if (!__DEV__) return;
    usePortfolioStore.getState().loadDemo();
    useSettingsStore.getState().setOnboarded(true);
    useSettingsStore.getState().setLanguage('en');
  });
  return <Redirect href="/" />;
}

const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

/**
 * Adopts the UIScene life cycle, which apps built with the iOS 27 SDK must use or they
 * crash at launch (UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
 *
 * Expo SDK 57 ships `ExpoAppSceneDelegate` but its prebuild template doesn't use it yet, so:
 * - Info.plist declares a single window scene handled by `EXExpoAppSceneDelegate`;
 * - AppDelegate provides the React Native factory, and the scene delegate creates the window.
 *
 * Remove once the Expo template does this itself.
 */
module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return c;
  });

  return withAppDelegate(config, (c) => {
    if (c.modResults.language !== 'swift') throw new Error('with-scene-lifecycle expects a Swift AppDelegate');
    let src = c.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    }
    // The scene delegate creates the window and starts React Native in it.
    src = src.replace(
      /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
      '\n',
    );
    if (!src.includes('ExpoReactNativeFactoryProvider') || src.includes('window = UIWindow(frame')) {
      throw new Error('with-scene-lifecycle could not patch AppDelegate.swift; the Expo template changed');
    }
    c.modResults.contents = src;
    return c;
  });
};

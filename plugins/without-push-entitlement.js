const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Removes the push notification entitlement that expo-notifications adds by itself.
 *
 * Hourfolio only schedules local reminders, which need no entitlement, and the free
 * Apple team used for device builds can't sign one. Remove this plugin when the app
 * starts sending real push notifications from a server (that needs a paid account).
 *
 * Keep it listed BEFORE `expo-notifications` in app.json: mods run last-added-first, so
 * this delete has to be added earlier to run after the entitlement is written.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};

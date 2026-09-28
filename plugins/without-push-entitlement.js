const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Removes the push notification entitlement that expo-notifications adds by itself.
 *
 * Hourfolio only schedules local reminders, which need no entitlement, and the free
 * Apple team used for device builds can't sign one. Remove this plugin when the app
 * starts sending real push notifications from a server (that needs a paid account).
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};

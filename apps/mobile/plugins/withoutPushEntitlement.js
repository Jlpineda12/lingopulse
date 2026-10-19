/**
 * La cuenta gratuita de Apple (Personal Team) no permite la capacidad de notificaciones push.
 * expo-notifications la agrega sola, pero LingoPulse solo usa recordatorios LOCALES (no necesitan push),
 * así que se quita "aps-environment" para poder instalar la app gratis desde Xcode.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};

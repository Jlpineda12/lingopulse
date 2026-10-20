/**
 * Configuración dinámica sobre app.json.
 * - Producción (tiendas): sin tráfico HTTP sin cifrar ni acceso a la red local.
 * - Desarrollo (APP_VARIANT=development): permite hablar con el servidor del Mac por la Wi-Fi de casa.
 */
module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'development') return config;
  return {
    ...config,
    name: `${config.name} (dev)`,
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
      infoPlist: {
        ...config.ios.infoPlist,
        NSLocalNetworkUsageDescription:
          'Solo en la versión de desarrollo: se conecta al servidor de IA de tu computador en la red Wi-Fi.',
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true, NSAllowsLocalNetworking: true },
      },
    },
    android: { ...config.android, package: `${config.android.package}.dev`, usesCleartextTraffic: true },
  };
};

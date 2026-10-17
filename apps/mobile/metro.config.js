// Metro config para el monorepo.
// @lingopulse/shared usa imports ESM con extensión ".js" que apuntan a archivos ".ts";
// Metro no hace ese mapeo por sí solo, así que lo resolvemos aquí.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolve ?? context.resolveRequest;
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return resolve(context, moduleName.slice(0, -3), platform);
    } catch {
      // Si no existe la versión sin extensión, cae al resolver normal.
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;

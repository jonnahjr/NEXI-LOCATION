const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the monorepo root (two levels up from apps/mobile)
const rootDir = path.resolve(__dirname, '../../');

const config = getDefaultConfig(__dirname);

// ── Monorepo workspace support ────────────────────────────────────────────
// Include the root node_modules so Metro can resolve workspace packages
// like @nexi/ai-ranking, @nexi/shared, @nexi/types
config.watchFolders = [
  path.resolve(rootDir, 'packages'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(rootDir, 'node_modules'),
];

// Disable strict package exports to fix resolution issues with
// libraries like react-native-gesture-handler that don't define
// a proper "exports" field in their package.json
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

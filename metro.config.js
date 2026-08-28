const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)
const defaultResolve = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const rewritten =
    moduleName.startsWith(".") || moduleName.startsWith("@/")
      ? moduleName.replace(/\.ts$/, "")
      : moduleName
  if (defaultResolve) return defaultResolve(context, rewritten, platform)
  return context.resolveRequest(context, rewritten, platform)
}

module.exports = config

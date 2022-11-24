const defaultFeatureFlags = [
  // Add Feature flags here
  { key: "showLocalNetwork", prod: false, dev: true },
  { key: "migrationAlert", prod: true, dev: true },
  { key: "instant3X", prod: false, dev: true },
  { key: "sweetVaults", prod: false, dev: true },
  { key: "portfolio", prod: false, dev: true },
];

const envEnabledDeafaultFeatureFlags: { [key: string]: boolean } = {};
defaultFeatureFlags.forEach(
  (flag) => (envEnabledDeafaultFeatureFlags[flag.key] = process.env.IS_DEV === "TRUE" ? flag.dev : flag.prod),
);

export default envEnabledDeafaultFeatureFlags;

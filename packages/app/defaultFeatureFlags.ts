const defaultFeatureFlags = [
  // Add Feature flags here
  { key: "showLocalNetwork", prod: false, dev: true },
];

const envEnabledDeafaultFeatureFlags: { [key: string]: boolean } = {};
defaultFeatureFlags.forEach(
  (flag) => (envEnabledDeafaultFeatureFlags[flag.key] = process.env.IS_DEV === "TRUE" ? flag.dev : flag.prod),
);

export default envEnabledDeafaultFeatureFlags;

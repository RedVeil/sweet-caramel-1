const defaultFeatureFlags = [
  // Add Feature flags here
  { key: "showLocalNetwork", prod: false, dev: true },
  { key: "migrationAlert", prod: true, dev: true },
  { key: "instant3X", prod: false, dev: false },
  { key: "sweetVaults", prod: false, dev: true },
  { key: "portfolio", prod: false, dev: true },
  { key: "optin_analytics", prod: false, dev: true },
];

const envEnabledDeafaultFeatureFlags: { [key: string]: boolean } = {};
defaultFeatureFlags.forEach(
  (flag) =>
    (envEnabledDeafaultFeatureFlags[flag.key] =
      !!process.env.NEXT_PUBLIC_IS_DEV || !!process.env.IS_DEV ? flag.dev : flag.prod),
);

export default envEnabledDeafaultFeatureFlags;

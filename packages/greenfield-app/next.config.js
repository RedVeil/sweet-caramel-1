const { join } = require("path");
const workspace = join(__dirname, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["rawcdn.githack.com"],
  },
  webpack: (config, options) => {
    /** Allows import modules from packages in workspace. */
    //config.externals = { ...config.externals, electron: 'electron' };
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [workspace],
          exclude: /node_modules/,
          use: options.defaultLoaders.babel,
        },
      ],
    };
    return config;
  },
};

module.exports = nextConfig;

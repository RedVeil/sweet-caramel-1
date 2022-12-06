const { join } = require("path");
// require("dotenv").config({ path: "../../.env" });
require("../utils/src/envLoader");

const workspace = join(__dirname, "..");

module.exports = {
	env: {
		INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
		RPC_URL: process.env.RPC_URL,
		CHAIN_ID: process.env.CHAIN_ID,
	},
	headers: async () => {
		return [
			{
				// matching all API routes
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Credentials", value: "true" },
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
					{
						key: "Access-Control-Allow-Headers",
						value:
							"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
					},
				],
			},
		];
	},
	poweredByHeader: false,
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

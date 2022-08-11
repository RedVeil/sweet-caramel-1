import getNamedAccounts from "@popcorn/hardhat/lib/utils/getNamedAccounts";
import { ChainId } from "@popcorn/utils";

export type Token = {
  name?: string;
  symbol?: string;
  description?: string;
  icon?: string;

  // additional props
  platform?: string;
};

export interface TokenContractMetadataOverride {
  [chainId: number]: {
    [contractAddress: string]: Token;
  };
}

const namedAccounts = getNamedAccounts();

export const TokenMetadataOverride: TokenContractMetadataOverride = {
  [ChainId.Polygon]: {
    [namedAccounts.xPop.polygon]: {
      name: "xPop",
      icon: "",
    },
    [namedAccounts.usdc.polygon]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.pop.polygon]: {
      name: "Pop",
      icon: "/images/icons/POP.svg",
    },
  },
  [ChainId.Arbitrum]: {
    [namedAccounts.xPop.arbitrum]: {
      name: "xPop",
    },
    [namedAccounts.usdc.arbitrum]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.xPop.arbitrum]: {
      name: "Pop",
      icon: "/images/icons/popLogo.png",
    },
  },
  [ChainId.BNB]: {
    [namedAccounts.xPop.bsc]: {
      name: "xPop",
    },
    [namedAccounts.usdc.binance]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.pop.bsc]: {
      name: "Pop",
    },
  },
  [ChainId.Hardhat]: {
    [namedAccounts.xPop.hardhat]: {
      name: "xPop",
    },
    [namedAccounts.dai.hardhat]: {
      name: "dai",
      icon: "/images/tokens/dai.webp",
    },
    [namedAccounts.usdc.hardhat]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.usdt.hardhat]: {
      name: "USDT",
      icon: "/images/tokens/usdt.webp",
    },
    [namedAccounts.threeCrv.hardhat]: {
      name: "threeCrv",
      icon: "/images/icons/3crv_icon.png",
    },
    [namedAccounts.butter.hardhat]: {
      name: "Butter (v2)",
      icon: "/images/icons/butterLogo.png",
    },
    [namedAccounts.yFrax.hardhat]: {
      name: "yFrax",
    },
    [namedAccounts.yRai.hardhat]: {
      name: "yRai",
    },
    [namedAccounts.yMusd.hardhat]: {
      name: "yMusd",
    },
    [namedAccounts.yAlusd.hardhat]: {
      name: "yAlusd",
    },
    [namedAccounts.crvFrax.hardhat]: {
      name: "crvFrax",
    },
    [namedAccounts.crvRai.hardhat]: {
      name: "crvRai",
    },
    [namedAccounts.crvMusd.hardhat]: {
      name: "crvMusd",
    },
    [namedAccounts.crvAlusd.hardhat]: {
      name: "crvAlusd",
    },
    [namedAccounts.pop.hardhat]: {
      name: "Pop",
    },
  },
  [ChainId.Localhost]: {
    [namedAccounts.xPop.hardhat]: {
      name: "xPop",
    },
    [namedAccounts.dai.hardhat]: {
      name: "dai",
      icon: "/images/tokens/dai.webp",
    },
    [namedAccounts.usdc.hardhat]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.usdt.hardhat]: {
      name: "USDT",
      icon: "/images/tokens/usdt.webp",
    },
    [namedAccounts.threeCrv.hardhat]: {
      name: "threeCrv",
      icon: "/images/icons/3crv_icon.png",
    },
    [namedAccounts.butter.hardhat]: {
      name: "Butter (v2)",
      icon: "/images/icons/butterLogo.png",
    },
    [namedAccounts.yFrax.hardhat]: {
      name: "yFrax",
    },
    [namedAccounts.yRai.hardhat]: {
      name: "yRai",
    },
    [namedAccounts.yMusd.hardhat]: {
      name: "yMusd",
    },
    [namedAccounts.yAlusd.hardhat]: {
      name: "yAlusd",
    },
    [namedAccounts.crvFrax.hardhat]: {
      name: "crvFrax",
    },
    [namedAccounts.crvRai.hardhat]: {
      name: "crvRai",
    },
    [namedAccounts.crvMusd.hardhat]: {
      name: "crvMusd",
    },
    [namedAccounts.crvAlusd.hardhat]: {
      name: "crvAlusd",
    },
    [namedAccounts.pop.hardhat]: {
      name: "Pop",
    },
  },
  [ChainId.Ethereum]: {
    [namedAccounts.dai.mainnet]: {
      name: "DAI",
    },
    [namedAccounts.pop.mainnet]: {
      name: "Pop",
    },
    [namedAccounts.usdc.mainnet]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.usdt.mainnet]: {
      name: "USDT",
      icon: "/images/tokens/usdt.webp",
    },
    [namedAccounts.threeCrv.mainnet]: {
      name: "threeCrv",
      icon: "/images/icons/3crv_icon.png",
    },
    [namedAccounts.butter.mainnet]: {
      name: "Butter (v2)",
      icon: "/images/icons/butterLogo.png",
    },
    [namedAccounts.yFrax.mainnet]: {
      name: "yFrax",
    },
    [namedAccounts.yRai.mainnet]: {
      name: "yRai",
    },
    [namedAccounts.yMusd.mainnet]: {
      name: "yMusd",
    },
    [namedAccounts.yAlusd.mainnet]: {
      name: "yAlusd",
    },
    [namedAccounts.crvFrax.mainnet]: {
      name: "crvFrax",
    },
    [namedAccounts.crvRai.mainnet]: {
      name: "crvRai",
    },
    [namedAccounts.crvMusd.mainnet]: {
      name: "crvMusd",
    },
    [namedAccounts.crvAlusd.mainnet]: {
      name: "crvAlusd",
    },
  },
  [ChainId.Rinkeby]: {
    [namedAccounts.dai.rinkeby]: {
      name: "dai",
      icon: "/images/tokens/dai.webp",
    },
    [namedAccounts.pop.rinkeby]: {
      name: "Pop",
    },
    [namedAccounts.usdc.rinkeby]: {
      name: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
    [namedAccounts.threeCrv.rinkeby]: {
      name: "threeCrv",
      icon: "/images/icons/3crv_icon.png",
    },
    [namedAccounts.butter.rinkeby]: {
      name: "butter",
      icon: "/images/icons/butterLogo.png",
    },
    [namedAccounts.yFrax.rinkeby]: {
      name: "yFrax",
    },
    [namedAccounts.yRai.rinkeby]: {
      name: "yRai",
    },
    [namedAccounts.yMusd.rinkeby]: {
      name: "yMusd",
    },
    [namedAccounts.yAlusd.rinkeby]: {
      name: "yAlusd",
    },
    [namedAccounts.crvFrax.rinkeby]: {
      name: "crvFrax",
    },
    [namedAccounts.crvRai.rinkeby]: {
      name: "crvRai",
    },
    [namedAccounts.crvMusd.rinkeby]: {
      name: "crvMusd",
    },
    [namedAccounts.crvAlusd.rinkeby]: {
      name: "crvAlusd",
    },
  },
};

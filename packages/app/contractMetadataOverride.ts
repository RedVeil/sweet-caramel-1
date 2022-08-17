import getNamedAccounts from "@popcorn/hardhat/lib/utils/getNamedAccounts";
import { HardhatConfigNetworks, HardhatConfigNetworksChainIdMapping } from "@popcorn/utils/src/connectors";
import { ERC20Metadata } from "@popcorn/utils/types";

const namedAccounts = getNamedAccounts();

const {
  xPop,
  usdc,
  dai,
  pop,
  usdt,
  sUSD,
  threeCrv,
  butter,
  yFrax,
  yRai,
  yMusd,
  yAlusd,
  crvFrax,
  crvRai,
  crvMusd,
  crvAlusd,
  popStaking,
  popUsdcArrakisVault,
  popUsdcUniV3Pool,
  popUsdcLp,
} = namedAccounts;

const config: OverrideConfig = [
  {
    addresses: xPop,
    metadata: {
      name: "xPOP",
      symbol: "xPOP",
      icon: "/images/icons/POP.svg",
    },
  },
  {
    addresses: usdc,
    metadata: {
      name: "USDC",
      symbol: "USDC",
      icon: "/images/tokens/usdc.webp",
    },
  },
  {
    addresses: pop,
    metadata: {
      name: "Popcorn",
      symbol: "POP",
      icon: "/images/icons/POP.svg",
    },
  },
  {
    addresses: popUsdcLp,
    metadata: {
      name: "Arrakis USDC/POP LP",
    },
  },
  {
    addresses: popUsdcArrakisVault,
    metadata: {
      name: "Arrakis USDC/POP LP",
    },
  },
  {
    addresses: popStaking,
    metadata: {
      name: "POP",
      symbol: "POP",
      icon: "/images/icons/POP.svg",
    },
  },
  {
    addresses: dai,
    metadata: {
      name: "DAI",
      symbol: "DAI",
      icon: "/images/tokens/dai.webp",
    },
  },
  {
    addresses: usdt,
    metadata: {
      name: "USDT",
      symbol: "USDT",
      icon: "/images/tokens/usdt.webp",
    },
  },
  {
    addresses: sUSD,
    metadata: {
      name: "sUSD",
      symbol: "sUSD",
      icon: "/images/tokens/sUSD.png",
    },
  },
  {
    addresses: threeCrv,
    metadata: {
      name: "threeCrv",
      symbol: "3CRV",
      icon: "/images/icons/3crv_icon.png",
    },
  },
  {
    addresses: butter,
    metadata: {
      name: "Butter (V2)",
      icon: "/images/icons/BTR.svg",
    },
  },
  {
    addresses: yFrax,
    metadata: {
      name: "yFrax",
    },
  },
  {
    addresses: yRai,
    metadata: {
      name: "yRai",
    },
  },
  {
    addresses: yMusd,
    metadata: {
      name: "yMusd",
    },
  },
  {
    addresses: yAlusd,
    metadata: {
      name: "yAlusd",
    },
  },
  {
    addresses: crvFrax,
    metadata: {
      name: "crvFrax",
    },
  },
  {
    addresses: crvRai,
    metadata: {
      name: "crvRai",
    },
  },
  {
    addresses: crvMusd,
    metadata: {
      name: "crvMusd",
    },
  },
  {
    addresses: crvAlusd,
    metadata: {
      name: "crvAlusd",
    },
  },
];

// singleton for tokenMetadataOverride so we only have to reduce the collection once.
let tokenMetadataOverride: TokenContractMetadataOverride = {};
export const getTokenMetadataOverride = (): TokenContractMetadataOverride => {
  if (Object.keys(tokenMetadataOverride).length == 0) {
    tokenMetadataOverride = generateTokenMetadataOverride(config);
  }

  return tokenMetadataOverride;
};

export const getContractMetadata = (chainId?: number, address?: string): ContractMetadata => {
  if (Object.keys(tokenMetadataOverride).length == 0) {
    tokenMetadataOverride = generateTokenMetadataOverride(config);
  }
  const mapping = getTokenMetadataOverride();
  return tokenMetadataOverride[chainId][address.toLowerCase()];
};

export const useContractMetadata = <TargetObject extends Object>({
  chainId,
  address,
  metadata,
}: {
  chainId: number;
  address: string;
  metadata?: TargetObject;
}): { override: ContractMetadata; metadata: TargetObject & ContractMetadata } => {
  const override = getContractMetadata(chainId, address);
  return {
    override,
    metadata: { ...metadata, ...override },
  };
};

export const generateTokenMetadataOverride = (config: OverrideConfig): TokenContractMetadataOverride => {
  const addToMapping = (
    mapping: TokenContractMetadataOverride,
    network: NetworkKeys,
    address: string,
    metadata: ContractMetadata,
  ) => {
    return {
      ...mapping,
      [HardhatConfigNetworksChainIdMapping[network]]: {
        ...mapping[HardhatConfigNetworksChainIdMapping[network]],
        [address?.toLowerCase()]: metadata,
      },
    };
  };
  return config.reduce((mapping, tokenOverride) => {
    const { metadata, addresses } = tokenOverride;
    Object.keys(addresses).map(
      (network) => (mapping = addToMapping({ ...mapping }, network as NetworkKeys, addresses[network], metadata)),
    );
    return mapping;
  }, {} as TokenContractMetadataOverride);
};

export type ContractMetadata = {
  name?: string;
  symbol?: string;
  description?: string;
  icon?: string;
  // additional props
  platform?: string;
};

export interface TokenContractMetadataOverride {
  [chainId: number]: {
    [contractAddress: string]: ContractMetadata;
  };
}

export type NetworkKeys = keyof HardhatConfigNetworks;
export interface OverrideObject {
  addresses: {
    [network in NetworkKeys]?: string;
  };
  metadata: ContractMetadata & Partial<ERC20Metadata>;
}
export type OverrideConfig = OverrideObject[];

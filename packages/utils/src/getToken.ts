import { TokenMetadataOverride } from "@popcorn/app/contractMetadataOverride";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { getSanitizedTokenDisplayName } from "../../app/helper/displayHelper";
import { ERC20__factory } from "../../hardhat/typechain/factories/ERC20__factory";
import { Token } from "./types";

export default async function getToken(erc20: ERC20, chainId: number): Promise<Token> {
  // OVERRIDE METADATA WHERE NEEDED.
  const overridingMetadata = TokenMetadataOverride[chainId][erc20.address];
  if (overridingMetadata) {
    return {
      contract: erc20,
      address: erc20.address,
      name: await erc20.name(),
      symbol: await erc20.symbol(),
      decimals: await erc20.decimals(),
      ...overridingMetadata,
    };
  }
  return {
    contract: erc20,
    address: erc20.address,
    name: getSanitizedTokenDisplayName(await erc20.name()),
    symbol: await erc20.symbol(),
    decimals: await erc20.decimals(),
  };
}

export const getTokenFromAddress = async (address: string, provider, chainId: number): Promise<Token> => {
  return getToken(ERC20__factory.connect(address, provider), chainId);
};

export async function getMultipleToken(multipleErc20: ERC20[], chainId: number): Promise<Token[]> {
  return Promise.all(multipleErc20.map(async (erc20) => await getToken(erc20, chainId)));
}

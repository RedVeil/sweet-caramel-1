import { getTokenMetadataOverride } from "@popcorn/app/contractMetadataOverride";
import { getTokenAllowance } from "@popcorn/app/hooks/tokens/useTokenAllowance";
import { ERC20Permit, ERC20Permit__factory } from "@popcorn/hardhat/typechain";
import { constants } from "ethers/lib/ethers";
import { getSanitizedTokenDisplayName } from "../../app/helper/displayHelper";
import { Token } from "./types";

const TokenMetadataOverride = getTokenMetadataOverride();

async function checkPermit(erc20: ERC20Permit) {
  try {
    await erc20.DOMAIN_SEPARATOR();
    return true;
  } catch {
    return false;
  }
}

export default async function getToken(
  erc20: ERC20Permit,
  provider,
  chainId: number,
  account?: string,
  spender?: string,
): Promise<Token> {
  // OVERRIDE METADATA WHERE NEEDED.
  if (erc20.address === constants.AddressZero || erc20.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
    return {
      contract: erc20,
      address: erc20.address, // Should we force this address to be smth specific like 0x000 | 0xEeee | ETH ?
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
      balance: account ? await provider.getBalance(account) : constants.Zero,
      allowance: constants.MaxUint256,
      icon: "/images/tokens/eth.png",
    };
  }
  const overridingMetadata = TokenMetadataOverride[chainId][erc20.address.toLowerCase()];
  if (overridingMetadata !== undefined) {
    return {
      contract: erc20,
      address: erc20.address,
      name: await erc20.name(),
      symbol: await erc20.symbol(),
      decimals: await erc20.decimals(),
      balance: account ? await erc20.balanceOf(account) : constants.Zero,
      permit: await checkPermit(erc20),
      allowance: account && spender ? await getTokenAllowance(erc20, account, spender) : constants.Zero,
      ...overridingMetadata,
    };
  }
  return {
    contract: erc20,
    address: erc20.address,
    name: getSanitizedTokenDisplayName(await erc20.name()),
    symbol: await erc20.symbol(),
    decimals: await erc20.decimals(),
    balance: account ? await erc20.balanceOf(account) : constants.Zero,
    permit: await checkPermit(erc20),
    allowance: account && spender ? await getTokenAllowance(erc20, account, spender) : constants.Zero,
  };
}

export const getTokenFromAddress = async (
  address: string,
  provider,
  chainId: number,
  account?: string,
  spender?: string,
): Promise<Token> => {
  return getToken(ERC20Permit__factory.connect(address, provider), provider, chainId, account, spender);
};

export async function getMultipleToken(
  multipleErc20: ERC20Permit[],
  provider,
  chainId: number,
  account?: string,
  spender?: string,
): Promise<Token[]> {
  return Promise.all(multipleErc20.map(async (erc20) => await getToken(erc20, provider, chainId, account, spender)));
}

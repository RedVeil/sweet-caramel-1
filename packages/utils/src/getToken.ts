import { ERC20 } from "@popcorn/hardhat/typechain";
import { Token } from "./types";
import { ERC20__factory } from "../../hardhat/typechain/factories/ERC20__factory";
import { getSanitizedTokenDisplayName } from "../../app/helper/displayHelper";

export default async function getToken(erc20: ERC20): Promise<Token> {
  return {
    contract: erc20,
    address: erc20.address,
    name: getSanitizedTokenDisplayName(await erc20.name()),
    symbol: await erc20.symbol(),
    decimals: await erc20.decimals(),
  };
}

export const getTokenFromAddress = async (address: string, provider): Promise<Token> => {
  return getToken(ERC20__factory.connect(address, provider));
};

export async function getMultipleToken(multipleErc20: ERC20[]): Promise<Token[]> {
  return Promise.all(multipleErc20.map(async (erc20) => await getToken(erc20)));
}

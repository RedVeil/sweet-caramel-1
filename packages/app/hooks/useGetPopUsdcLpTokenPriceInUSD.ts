import { Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { ERC20, ERC20__factory } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils";
import { BigNumber, ethers } from "ethers";
import useSWR from "swr";
import { useDeployment } from "./useDeployment";
import { useRpcProvider } from "./useRpcProvider";

export const getPopUsdcLpTokenPrice = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  chainId: ChainId,
  token: string,
  usdc: string,
  pop: string,
) => {
  const [popUsdcLp, usdcAmount, popAmount] = await getPool2Assets(provider, token, chainId, usdc, pop);
  try {
    const totalSupply = await popUsdcLp.totalSupply();
    const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
    const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));

    return totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
  } catch (ex) {
    console.log("error while querying LP-Token price. ex - ", ex.toString());
  }
};

const getPool2Assets = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  address: string,
  chainId: ChainId,
  usdc: string,
  pop: string,
): Promise<[ERC20, BigNumber, BigNumber]> => {
  const popUsdcLp = ERC20__factory.connect(address, provider);

  let usdcAmount = await ERC20__factory.connect(usdc, provider).balanceOf(address);
  const popAmount = await ERC20__factory.connect(pop, provider).balanceOf(address);
  return [popUsdcLp, usdcAmount, popAmount];
};

export default function useGetPopUsdcLpTokenPriceInUSD(token: string, chainId: ChainId) {
  const provider = useRpcProvider(chainId);
  const { usdc, pop } = useDeployment(chainId);
  const shouldFetch = provider && [ChainId.Ethereum, ChainId.Polygon, ChainId.Hardhat].includes(chainId);
  return useSWR(shouldFetch ? ["getPopUsdcLpTokenPrice", provider, chainId, token, usdc, pop] : null, async () =>
    getPopUsdcLpTokenPrice(provider, chainId, token, usdc, pop),
  );
}

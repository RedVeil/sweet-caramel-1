import { Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { ERC20__factory, IGUni__factory } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils";
import { Address, ContractAddresses } from "@popcorn/utils/types";
import { BigNumber, Contract, ethers } from "ethers";
import useWeb3 from "hooks/useWeb3";
import useSWR from "swr";

export const getPopUsdcLpTokenPrice = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  contractAddresses: ContractAddresses,
  chaindId: ChainId,
  token: Address,
) => {
  const [popUsdcLp, usdcAmount, popAmount] =
    chaindId === ChainId.Ethereum ||
    contractAddresses.popUsdcArrakisVault.toLocaleLowerCase() === token.toLocaleLowerCase()
      ? await getGUniAssets(provider, token)
      : await getPool2Assets(provider, contractAddresses);
  try {
    const totalSupply = await popUsdcLp.totalSupply();
    const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
    const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));

    return totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
  } catch (ex) {
    console.log("error while querying LP-Token price. ex - ", ex.toString());
  }
};

const getGUniAssets = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  token: Address,
): Promise<[Contract, BigNumber, BigNumber]> => {
  const popUsdcLp = IGUni__factory.connect(token, provider);
  const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
  return [popUsdcLp, usdcAmount, popAmount];
};

const getPool2Assets = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  contractAddresses: ContractAddresses,
): Promise<[Contract, BigNumber, BigNumber]> => {
  const popUsdcLp = ERC20__factory.connect(contractAddresses.popUsdcLp, provider);
  let usdcAmount = await ERC20__factory.connect(contractAddresses.usdc, provider).balanceOf(
    contractAddresses.popUsdcLp,
  );
  const popAmount = await ERC20__factory.connect(contractAddresses.pop, provider).balanceOf(
    contractAddresses.popUsdcLp,
  );
  return [popUsdcLp, usdcAmount, popAmount];
};

export default function useGetPopUsdcLpTokenPriceInUSD(token: Address) {
  const { signerOrProvider, chainId, contractAddresses } = useWeb3();
  const shouldFetch = signerOrProvider && contractAddresses && contractAddresses.popUsdcLp;
  return useSWR(shouldFetch ? ["getPopUsdcLpTokenPrice", signerOrProvider, chainId, token] : null, async () =>
    getPopUsdcLpTokenPrice(signerOrProvider, contractAddresses, chainId, token),
  );
}

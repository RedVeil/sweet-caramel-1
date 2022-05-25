import { Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { ERC20__factory, IGUni__factory } from "@popcorn/hardhat/typechain";
import { ContractAddresses } from "@popcorn/utils/types";
import { ChainId } from "context/Web3/connectors";
import { BigNumber, Contract, ethers } from "ethers";
import useWeb3 from "hooks/useWeb3";
import useSWR from "swr";

export const getPopUsdcLpTokenPrice = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  contractAddresses: ContractAddresses,
  chaindId: ChainId,
) => {
  const [popUsdcLp, usdcAmount, popAmount] =
    chaindId === ChainId.Ethereum
      ? await getGUniAssets(provider, contractAddresses)
      : await getPool2Assets(provider, contractAddresses);
  try {
    const totalSupply = await popUsdcLp.totalSupply();
    const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
    const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));
    const price = totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
    return price;
  } catch (ex) {
    console.log("error while querying LP-Token price. ex - ", ex.toString());
  }
};

const getGUniAssets = async (
  provider: Web3Provider | ethers.providers.JsonRpcSigner,
  contractAddresses: ContractAddresses,
): Promise<[Contract, BigNumber, BigNumber]> => {
  const popUsdcLp = IGUni__factory.connect(contractAddresses.popUsdcLp, provider);
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

export default function useGetPopUsdcLpTokenPriceInUSD() {
  const { signerOrProvider, chainId, contractAddresses } = useWeb3();
  const shouldFetch = signerOrProvider && contractAddresses && contractAddresses.popUsdcLp;
  return useSWR(shouldFetch ? ["getPopUsdcLpTokenPrice", signerOrProvider, chainId] : null, async () =>
    getPopUsdcLpTokenPrice(signerOrProvider, contractAddresses, chainId),
  );
}

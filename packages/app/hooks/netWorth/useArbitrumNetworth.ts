import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import useGetPopTokenPriceInUSD from "hooks/useGetPopTokenPriceInUSD";
import { useGetUserEscrows, useGetUserVaultsEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import getHoldingValue from "helper/getHoldingValue";

export default function useArbitrumNetworth(): { [key: string]: BigNumber } {
  const { account } = useWeb3();
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { pop: arbitrumPopAddress } = useMemo(() => getChainRelevantContracts(ChainId.Arbitrum), []);

  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), []);
  const { data: arbitrumPopBalance } = useTokenBalance(
    erc20(arbitrumPopAddress, PRC_PROVIDERS[ChainId.Arbitrum]),
    account,
  );
  const { data: arbitrumEscrow } = useGetUserEscrows(ChainId.Arbitrum, PRC_PROVIDERS[ChainId.Arbitrum]);
  const { data: arbitrumVaultEscrow } = useGetUserVaultsEscrows(ChainId.Arbitrum, PRC_PROVIDERS[ChainId.Arbitrum]);
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);

  const arbitrumPopHoldings = useMemo(
    () => (arbitrumPopBalance ? getHoldingValue(arbitrumPopBalance, raisedPopPrice) : constants.Zero),
    [arbitrumPopBalance],
  );

  const arbitrumEscrowHoldings = useMemo(
    () =>
      arbitrumEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(arbitrumEscrow?.totalClaimablePop || "0")
            .add(arbitrumEscrow?.totalVestingPop || "0")
            .add(arbitrumVaultEscrow?.totalClaimablePop || "0")
            .add(arbitrumVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [arbitrumEscrow],
  );

  const calculateArbitrumHoldings = (): BigNumber => {
    return [
      arbitrumPopHoldings,
      arbitrumEscrowHoldings,
    ].reduce((total, num) => total.add(num));
  }

  return {
    total: calculateArbitrumHoldings(),
    inWallet: arbitrumPopHoldings,
    deposit: BigNumber.from("0"),
    vesting: arbitrumEscrowHoldings,
  }
}
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
import usePopLocker from "hooks/staking/usePopLocker";

export default function usePolygonNetworth(): { [key: string]: BigNumber } {
  const { account, contractAddresses } = useWeb3();
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { pop: polygonPopAddress, popStaking: polygonPopStakingAddress } = useMemo(
    () => getChainRelevantContracts(ChainId.Polygon),
    [],
  );
  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), []);
  const { data: polygonPopStaking } = usePopLocker(polygonPopStakingAddress);
  const { data: polygonPopBalance } = useTokenBalance(
    erc20(polygonPopAddress, PRC_PROVIDERS[ChainId.Polygon]),
    account,
  );
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);
  const { data: polygonEscrow } = useGetUserEscrows(ChainId.Polygon, PRC_PROVIDERS[ChainId.Polygon]);
  const { data: polygonVaultEscrow } = useGetUserVaultsEscrows(ChainId.Polygon, PRC_PROVIDERS[ChainId.Polygon]);

  const polygonPopHoldings = useMemo(
    () => (polygonPopBalance ? getHoldingValue(polygonPopBalance, raisedPopPrice) : constants.Zero),
    [polygonPopBalance],
  );

  const polygonPopStakingHoldings = useMemo(
    () => (polygonPopStaking ? getHoldingValue(polygonPopStaking.userStake, raisedPopPrice) : constants.Zero),
    [polygonPopStaking],
  );

  const polygonEscrowHoldings = useMemo(
    () =>
      polygonEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(polygonEscrow?.totalClaimablePop || "0")
            .add(polygonEscrow?.totalVestingPop || "0")
            .add(polygonVaultEscrow?.totalClaimablePop || "0")
            .add(polygonVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [polygonEscrow],
  );

  const calculatePolygonHoldings = (): BigNumber => {
    return [
      polygonPopHoldings,
      polygonPopStakingHoldings,
      polygonEscrowHoldings,
    ].reduce((total, num) => total.add(num));
  }

  return {
    total: calculatePolygonHoldings(),
    inWallet: polygonPopHoldings,
    staking: polygonPopStakingHoldings,
    vesting: polygonEscrowHoldings
  }
}
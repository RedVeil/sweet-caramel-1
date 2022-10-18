import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import usePopLocker from "hooks/staking/usePopLocker";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import useGetPopTokenPriceInUSD from "hooks/useGetPopTokenPriceInUSD";
import { useGetUserEscrows, useGetUserVaultsEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import getHoldingValue from "helper/getHoldingValue";
import useThreeXNetworth from "./useThreeXNetworth";
import useButterNetworth from "./useButterNetworth";



export default function useEthereumNetworth(): { [key: string]: BigNumber } {
  const { account } = useWeb3();
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { pop, popStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), [])
  const { data: mainnetPopStaking } = usePopLocker(popStaking);
  const { data: mainnetPopBalance } = useTokenBalance(erc20(pop, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: mainnetEscrow } = useGetUserEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);
  const { data: mainnetVaultEscrow } = useGetUserVaultsEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);

  const { threeXHoldings, threeXStakingHoldings, threeXRedeemBatchHoldings } = useThreeXNetworth()
  const {
    butterHoldings,
    butterStakingHoldings,
    butterRedeemBatchHoldings,
  } = useButterNetworth();

  const mainnetPopHoldings = useMemo(
    () => (mainnetPopBalance ? getHoldingValue(mainnetPopBalance, raisedPopPrice) : constants.Zero),
    [mainnetPopBalance],
  );

  const mainnetPopStakingHoldings = useMemo(
    () => (mainnetPopStaking ? getHoldingValue(mainnetPopStaking.userStake, raisedPopPrice) : constants.Zero),
    [mainnetPopStaking],
  );

  const mainnetEscrowHoldings = useMemo(
    () =>
      mainnetEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(mainnetEscrow?.totalClaimablePop || "0")
            .add(mainnetEscrow?.totalVestingPop || "0")
            .add(mainnetVaultEscrow?.totalClaimablePop || "0")
            .add(mainnetVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [mainnetEscrow],
  );

  const calculateEthereumHoldings = (): BigNumber => {
    return [
      mainnetPopHoldings,
      mainnetPopStakingHoldings,
      butterHoldings,
      threeXHoldings,
      butterStakingHoldings,
      threeXStakingHoldings,
      mainnetEscrowHoldings,
      butterRedeemBatchHoldings,
      threeXRedeemBatchHoldings,
    ].reduce((total, num) => total.add(num));
  }

  const totalDeposits = () => {
    return [
      threeXHoldings,
      threeXStakingHoldings,
      threeXRedeemBatchHoldings,
      butterStakingHoldings,
      butterHoldings,
      butterRedeemBatchHoldings,
      mainnetPopStakingHoldings
    ].reduce((total, num) => total.add(num));
  }

  return {
    total: calculateEthereumHoldings(),
    inWallet: mainnetPopHoldings,
    deposit: totalDeposits(),
    vesting: mainnetEscrowHoldings
  }
}
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import useButterBatchData from "hooks/set/useButterBatchData";
import useThreeXData from "hooks/set/useThreeXData";
import usePopLocker from "hooks/staking/usePopLocker";
import useStakingPool from "hooks/staking/useStakingPool";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import useGetPopTokenPriceInUSD from "hooks/useGetPopTokenPriceInUSD";
import { useGetUserEscrows, useGetUserVaultsEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";

// move into utils so it can be used for other networks
function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}

export default function useEthereumHoldings() {
  const { account, contractAddresses } = useWeb3();
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { pop, butter, threeX, butterStaking, threeXStaking, popStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), [])
  const { data: mainnetPopStaking } = usePopLocker(popStaking);
  const { data: mainnetPopBalance } = useTokenBalance(erc20(pop, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: mainnetEscrow } = useGetUserEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);
  const { data: mainnetVaultEscrow } = useGetUserVaultsEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);
  const mainnetPopHoldings = useMemo(
    () => (mainnetPopBalance ? getHoldingValue(mainnetPopBalance, raisedPopPrice) : constants.Zero),
    [mainnetPopBalance],
  );

  const mainnetPopStakingHoldings = useMemo(
    () => (mainnetPopStaking ? getHoldingValue(mainnetPopStaking.userStake, raisedPopPrice) : constants.Zero),
    [mainnetPopStaking],
  );

  const s = useMemo(
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
}
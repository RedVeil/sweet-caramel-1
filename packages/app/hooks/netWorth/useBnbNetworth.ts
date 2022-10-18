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

export default function bnbNetworth(): { [key: string]: BigNumber } {
  const { account } = useWeb3();
  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), []);
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);


  const { pop: bnbPopAddress } = useMemo(() => getChainRelevantContracts(ChainId.BNB), []);
  const { data: bnbPopBalance } = useTokenBalance(erc20(bnbPopAddress, PRC_PROVIDERS[ChainId.BNB]), account);
  const { data: bnbEscrow } = useGetUserEscrows(ChainId.BNB, PRC_PROVIDERS[ChainId.BNB]);
  const { data: bnbVaultEscrow } = useGetUserVaultsEscrows(ChainId.BNB, PRC_PROVIDERS[ChainId.BNB]);

  const bnbPopHoldings = useMemo(
    () => (bnbPopBalance ? getHoldingValue(bnbPopBalance, raisedPopPrice) : constants.Zero),
    [bnbPopBalance],
  );
  const bnbEscrowHoldings = useMemo(
    () =>
      bnbEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(bnbEscrow?.totalClaimablePop || "0")
            .add(bnbEscrow?.totalVestingPop || "0")
            .add(bnbVaultEscrow?.totalClaimablePop || "0")
            .add(bnbVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [bnbEscrow],
  );

  const calculateBnbHoldings = (): BigNumber => {
    return [
      bnbPopHoldings,
      bnbEscrowHoldings
    ].reduce((total, num) => total.add(num));
  }

  return {
    total: calculateBnbHoldings(),
    inWallet: bnbPopHoldings,
    deposit: BigNumber.from("0"),
    vesting: bnbEscrowHoldings
  }
}
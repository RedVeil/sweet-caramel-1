import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useArbitrumNetworth from "./useArbitrumNetworth";
import useBnbNetworth from "./useBnbNetworth";
import useEthereumNetworth from "./useEthereumNetworth";
import usePolygonNetworth from "./usePolygonNetworth";

interface Networth {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
}

type Result = { [key in ChainId]?: Networth } & { total: Networth };

export default function useNetWorth(): Result {
  const ethereumNetworth = useEthereumNetworth();
  const polygonNetworth = usePolygonNetworth();
  const bnbNetworth = useBnbNetworth();
  const arbitrumNetworth = useArbitrumNetworth();

  const calculateTotalHoldings = (): BigNumber => {
    return [ethereumNetworth.total, polygonNetworth.total, bnbNetworth.total, arbitrumNetworth.total].reduce(
      (total, num) => total.add(num),
    );
  };

  const calculateTotalInWallet = (): BigNumber => {
    return [
      ethereumNetworth.inWallet,
      polygonNetworth.inWallet,
      bnbNetworth.inWallet,
      arbitrumNetworth.inWallet,
    ].reduce((total, num) => total.add(num));
  };

  const calculateTotalDeposit = (): BigNumber => {
    return [ethereumNetworth.deposit, polygonNetworth.deposit, bnbNetworth.deposit, arbitrumNetworth.deposit].reduce(
      (total, num) => total.add(num),
    );
  };

  const calculateTotalVesting = (): BigNumber => {
    return [ethereumNetworth.vesting, polygonNetworth.vesting, bnbNetworth.vesting, arbitrumNetworth.vesting].reduce(
      (total, num) => total.add(num),
    );
  };

  return {
    [ChainId.Ethereum]: ethereumNetworth,
    [ChainId.Polygon]: polygonNetworth,
    [ChainId.BNB]: bnbNetworth,
    [ChainId.Arbitrum]: arbitrumNetworth,
    total: {
      total: calculateTotalHoldings(),
      inWallet: calculateTotalInWallet(),
      deposit: calculateTotalDeposit(),
      vesting: calculateTotalVesting(),
    },
  };
}

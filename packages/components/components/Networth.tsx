import { formatAndRoundBigNumber } from "@popcorn/utils";
import { useNetworth } from "../hooks/portfolio/useNetworth";
import { PortfolioState, UpdateNetworthActionProps } from "../reducers/portfolio";
import { BigNumber, constants } from "ethers";
import { useComponentState } from "../hooks/useComponentState";

interface NetworthProps {
  state: PortfolioState;
  expected: number;
  account?: string;
  loading?: boolean;
  allContracts?: string[];
  updateNetworth?: (args: UpdateNetworthActionProps) => void;
}

export const Networth: React.FC<NetworthProps> = ({ state, expected, allContracts, updateNetworth, account }) => {
  const networth = useNetworth(state, expected, allContracts, updateNetworth, account)

  const { ready, loading } = useComponentState({
    ready: !!networth || !!account,
    loading: !account || !networth,
  }, [networth, account]);

  return (
    <>
      <div className={`border-b border-gray-200 pb-5`}>
        <h3 className={`text-lg font-medium leading-6 text-gray-900 ${!ready ? "" : "hidden"}`}>
          Please connect your wallet to view your networth
        </h3>
        <h3 className={`text-lg font-medium leading-6 text-gray-900 ${ready ? "" : "hidden"}`}>
          Connected to {ready && account}
        </h3>
        <h3 className={`text-lg font-medium leading-6 text-gray-900  ${!loading && ready ? "" : "hidden"}`}>
          Networth:  {!loading && ready && formatAndRoundBigNumber(networth || constants.Zero, 18)}
        </h3>
        <h3 className={`text-lg font-medium leading-6 text-gray-900  ${loading ? "" : "hidden"}`}>Loading ...</h3>
      </div>
    </>
  );
};

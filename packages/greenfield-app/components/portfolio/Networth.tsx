import { formatAndRoundBigNumber } from "@popcorn/utils";
import { useNetworth } from "hooks/portfolio/useNetworth";
import { PortfolioState, UpdateNetworthActionProps } from "reducers/portfolio";
import { useAccount } from "wagmi";

interface NetworthProps {
  state: PortfolioState;
  account?: string;
  updateNetworth: (args: UpdateNetworthActionProps) => void;
}

export const Networth: React.FC<NetworthProps> = ({ state, updateNetworth, account }) => {
  const { address } = useAccount();
  const networth = useNetworth(state, updateNetworth, account);

  return (
    <div className="border-b border-gray-200 pb-5">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        Networth:{" "}
        {(!!address && networth && `$${formatAndRoundBigNumber(networth, 18)}`) ||
          (account && "Loading ...") ||
          "Please connect your wallet"}
      </h3>
    </div>
  );
};

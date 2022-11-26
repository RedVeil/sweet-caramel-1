import { ChainId } from "packages/utils";
import { BigNumber } from "ethers";
import { withBalanceOf } from "./withBalanceOf";
import withLoading from "./withLoading";
import { withEscrowBalance } from "./withEscrowBalance";

type Response = {
  value?: BigNumber;
  formatted?: string;
};
interface BalanceProps {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
  balance?: Response;
  rewardsEscrowBalance?: Response;
}

const Balance_: React.FC<BalanceProps> = ({ balance, rewardsEscrowBalance }) => {
  return (
    <>
      <div>
        Balance: {balance?.formatted || rewardsEscrowBalance?.formatted || "0"}
      </div>
    </>
  );
};


export const Balance = withEscrowBalance(withBalanceOf(withLoading(Balance_)));
export default Balance;

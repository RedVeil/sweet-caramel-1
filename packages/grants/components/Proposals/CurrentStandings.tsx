import { parseEther } from "@ethersproject/units";
import { Proposal } from "@popcorn/hardhat/lib/adapters";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import Divider from "components/CommonComponents/Divider";
import ProgressBar from "components/ProgressBar";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";

const CurrentStandings: React.FC<Proposal> = (proposal) => {
  return (
    <div className="content-center mx-48">
      <div className="grid my-2 justify-items-stretch">
        <span className="mx-4  w-1/2 justify-self-center flex flex-row justify-between">
          <p className="text-xl font-semibold text-gray-900">Current Standings</p>
        </span>
      </div>
      <div className="grid my-2 justify-items-stretch">
        <span className="mx-4  w-1/2 justify-self-center flex flex-row justify-between  pb-2">
          <ProgressBar
            progress={
              proposal?.votes?.for === BigNumber.from("0")
                ? 0
                : Number(
                    formatUnits(
                      proposal?.votes?.for
                        .mul(parseEther("100"))
                        .div(proposal?.votes?.for.add(proposal?.votes?.against)),
                    ),
                  )
            }
            progressColor={"bg-green-300"}
          />
        </span>
      </div>
      <div className="grid my-2 justify-items-stretch">
        <span className="mx-4  w-1/2 justify-self-center flex flex-row justify-between">
          <p className=" font-medium text-gray-700">Votes For</p>
          <span className="text-base text-gray-700 flex flex-row">
            <p>{formatAndRoundBigNumber(proposal?.votes?.for, 18)}</p>
          </span>
        </span>
        <span className="mx-4  w-1/2 justify-self-center flex flex-row justify-between">
          <p className="font-medium text-gray-700">Votes Against</p>
          <span className="text-base text-gray-700 flex flex-row">
            <p>{formatAndRoundBigNumber(proposal?.votes?.against, 18)}</p>
          </span>
        </span>
        <span className="mx-4  w-1/2 justify-self-center flex flex-row justify-between">
          <p className="text-lg font-medium text-gray-700">Total Votes</p>
          <span className="text-base text-gray-700 flex flex-row">
            <p>{formatAndRoundBigNumber(proposal?.votes?.for.add(proposal?.votes?.against), 18)}</p>
          </span>
        </span>
      </div>
      <Divider />
    </div>
  );
};
export default CurrentStandings;

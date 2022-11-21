import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import StakeModalContent from "components/Proposals/StakeModalContent";
import "rc-slider/assets/index.css";

const ONE_WEEK = 604800;
const lockPeriods = [
  { label: "1 week", value: ONE_WEEK },
  { label: "1 month", value: ONE_WEEK * 4 },
  { label: "3 months", value: ONE_WEEK * 4 * 3 },
  { label: "6 months", value: ONE_WEEK * 4 * 6 },
  { label: "1 year", value: ONE_WEEK * 52 },
  { label: "4 years", value: ONE_WEEK * 52 * 4 },
];

export default function LockPop() {
  const context = useWeb3React<Web3Provider>();
  return (
    <div className="w-full bg-gray-900 h-screen">
      <div className="bg-white w-1/3 mx-auto">
        <StakeModalContent beneficiary={null} onCloseStakeModal={() => {}} hasExpired={false} closePopUp={() => {}} />
      </div>
    </div>
  );
}

import { Web3Provider } from "@ethersproject/providers";
import Slider from "@mui/material/Slider";
import { styled } from "@mui/material/styles";
import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import { useWeb3React } from "@web3-react/core";
import Button from "components/CommonComponents/Button";
import { ContractsContext } from "context/Web3/contracts";
import { utils } from "ethers";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getNamedAccountsByChainId } from "../../../hardhat/lib/utils/getNamedAccounts";
import { XIcon } from "@heroicons/react/outline";

interface StakeModalProps {
  beneficiary: BeneficiaryApplication;
  onCloseStakeModal: () => void;
  hasExpired: boolean;
  closePopUp: () => void;
}
const TWELVE_WEEKS = 604800 * 4 * 3;

const StakeModalContent: React.FC<StakeModalProps> = ({ beneficiary, onCloseStakeModal, hasExpired, closePopUp }) => {
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [popBalance, setPopBalance] = useState(0);
  const [approved, setApproval] = useState<number>(0);
  const { account, chainId, library } = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const [popToLock, setPopToLock] = useState<number>(0);
  const [wait, setWait] = useState<boolean>(false);
  const [lockDuration, setLockDuration] = useState<number>(TWELVE_WEEKS);

  useEffect(() => {
    if (!account) {
      return;
    }
    contracts.pop.balanceOf(account).then((res) => setPopBalance(Number(utils.formatEther(res))));
    contracts.pop
      .allowance(account, getNamedAccountsByChainId(chainId).popStaking)
      .then((res) => setApproval(Number(utils.formatEther(res))));
  }, [account]);

  const lockPop = async (): Promise<void> => {
    setWait(true);
    toast.loading("Staking POP...");
    const lockedPopInEth = utils.parseEther(popToLock.toString());
    const signer = library.getSigner();
    const connectedStaking = contracts.staking.connect(signer);
    await connectedStaking
      .stake(lockedPopInEth, lockDuration)
      .then((res) => {
        toast.success("POP staked!");
        onCloseStakeModal();
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err?.data?.message?.split("'")[1] || "Error staking POP");
      });
    setWait(false);
  };

  return (
    <div className="text-left text-base text-gray-900 relative">
      <div className="flex justify-between">
        <div className="basis-11/12 md:basis-9/12">
          <p className="text-base text-primaryDark">In order to participate in the Open Vote, you need vote credits. Stake your POP to gain voice credits</p>
        </div>
        <button className="flex justify-end">
          <XIcon className="w-10 h-10 text-black" onClick={() => closePopUp()} />
        </button>
      </div>

      <div className="mt-10">
        <div className="flex justify-between mb-4">
          <p className="font-[500] text-black">Stake POP</p>
          <p className="font-[500] text-black">
            {Math.floor(popToLock)}/{Math.floor(popBalance)}
          </p>
        </div>
        <div className={`${popToLock?.toString() === '0' ? 'ml-4' : ''} ${popToLock?.toString() === popBalance?.toString() ? 'mr-4' : ''}`}>
          <CustomSlider
            aria-label="pop lock slider"
            min={0}
            max={popBalance}
            onChange={(e) => setPopToLock(Number((e.target as HTMLInputElement).value))}
            disabled={account && approved >= popToLock && hasExpired}
            size="small"
            step={1}
            valueLabelDisplay="off"
          />
        </div>
      </div>
      <hr className="my-10" />
      <div className="flex items-start">
        <div className="flex items-center h-6">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={() => {
              setTermsAccepted(!termsAccepted);
            }}
            className="focus:ring-gray-500 h-5 w-5 text-primaryDark border-customLightGray rounded"
          />
        </div>
        <div className="ml-4">
          <label htmlFor="terms" className="font-[500] text-black leading-[140%] text-base">
            Accept reward terms and conditions:
          </label>
          <ol className="pt-4 text-left list-decimal pl-5 space-y-4 text-primaryDark text-base">
            <li>
              Your staked tokens will be locked for a period of <span className="font-[500] text-black">3 months.</span> You will be
              unable to access your tokens during this period.
            </li>
            <li>
              Your staked tokens must be re-staked or withdrawn after the 3-month lock time expires or they will be
              subjected to a penalty of 1% per epoch that they are not re-staked.
            </li>
            <li>
              After rewards are earned and claimed, 10% is immediately transferred, and the rest of the earned amount is
              unlocked linearly over the following 365 day period.
            </li>
          </ol>
        </div>
      </div>
      <Button variant="primary" className="w-full py-2 mt-10" disabled={wait} onClick={lockPop}>
        Stake
      </Button>
    </div>
  );
};

const CustomSlider = styled(Slider)({
  color: "#645F4C",
  height: 4,
  padding: "0px",
  "& .MuiSlider-track": {
    border: "2px solid #645F4C",
  },
  "& .MuiSlider-thumb": {
    height: 15,
    width: 15,
    backgroundColor: "#645F4C",
    border: "4px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
    "&:after": {
      outline: "4px solid #645F4C",
      width: 24,
      height: 24,
    },
  },
});

export default StakeModalContent;

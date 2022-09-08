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

interface StakeModalProps {
  beneficiary: BeneficiaryApplication;
  onCloseStakeModal: () => void;
  hasExpired: boolean;
}
const TWELVE_WEEKS = 604800 * 4 * 3;

const StakeModalContent: React.FC<StakeModalProps> = ({ beneficiary, onCloseStakeModal, hasExpired }) => {
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
    <div className="text-left text-base text-gray-900">
      <p className="text-base">In order to participate in the Open Vote, you need to stake POP.</p>
      <div className="flex justify-between py-8">
        <p className="font-semibold text-gray-900">Stake POP</p>
        <p className="font-semibold text-gray-900">
          {Math.floor(popToLock)}/{Math.floor(popBalance)}
        </p>
      </div>
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
      <hr className="my-8" />
      <div className="flex items-center">
        <div className="flex items-center h-6">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={() => {
              setTermsAccepted(!termsAccepted);
            }}
            className="focus:ring-0 h-6 w-6 text-blue-600 border-gray-300 rounded-lg"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="font-semibold text-gray-900">
            Accept reward terms and conditions:
          </label>
        </div>
      </div>
      <ol className="py-8 text-left pl-10 list-decimal">
        <li className="py-3">
          Your staked tokens will be locked for a period of <span className="font-semibold">12 weeks</span> You will be
          unable to access your tokens during this period.
        </li>
        <li className="py-3">
          Your staked tokens must be re-staked or withdrawn after the 3-month lock time expires or they will be
          subjected to a penalty of 1% per epoch that they are not re-staked.
        </li>
        <li className="py-3">
          After rewards are earned and claimed, 10% is immediately transferred, and the rest of the earned amount is
          unlocked linearly over the following 365 day period.
        </li>
      </ol>
      <Button variant="primary" className="w-full py-2" disabled={wait} onClick={lockPop}>
        Stake
      </Button>
    </div>
  );
};

const CustomSlider = styled(Slider)({
  color: "#1E40AF",
  height: 4,
  padding: "0px",
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 20,
    width: 20,
    backgroundColor: "#fff",
    border: "4px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
});

export default StakeModalContent;

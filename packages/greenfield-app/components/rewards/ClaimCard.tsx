import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { constants, Signer } from "ethers";
import { ChainId, formatAndRoundBigNumber, networkLogos } from "@popcorn/utils";
import { useContractMetadata } from "@popcorn/app/hooks/useContractMetadata";
import { setMultiChoiceActionModal } from "@popcorn/app/context/actions";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useTransaction } from "@popcorn/app/hooks/useTransaction";
import { useContext } from "react";
import { store } from "@popcorn/app/context/store";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import { StakingType } from "hooks/staking/useAllStakingContracts";
import ContentLoader from "react-content-loader";
import Image from "next/image";

interface ClaimCardProps {
  stakingAddress: string;
  stakingType: StakingType;
  chainId: ChainId;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ stakingAddress, stakingType, chainId }) => {
  const { account, signer } = useWeb3();
  const { dispatch } = useContext(store);
  const transaction = useTransaction(chainId);

  // Fetch either popLocker or stakingPool
  const {
    data: popLocker,
    isValidating: popLockerIsValidating,
    error: popLockerError,
  } = usePopLocker(stakingAddress, stakingType === StakingType.PopLocker ? chainId : undefined);
  const {
    data: stakingPool,
    isValidating: stakingPoolIsValidating,
    error: stakingPoolError,
  } = useStakingPool(stakingAddress, stakingType === StakingType.StakingPool ? chainId : undefined);
  const staking = stakingType === StakingType.PopLocker ? popLocker : stakingPool;
  const isValidating = stakingType === StakingType.PopLocker ? popLockerIsValidating : stakingPoolIsValidating;
  const error = stakingType === StakingType.PopLocker ? popLockerError : stakingPoolError;

  const metadata = useContractMetadata(staking?.stakingToken?.address, chainId);

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean, signer: Signer, account: string) => {
    transaction(
      () => pool.connect(signer).getReward(isPopLocker ? account : null),
      "Claiming Reward...",
      "Rewards Claimed!",
      () => {
        if (!localStorage.getItem("hideClaimModal")) {
          dispatch(
            setMultiChoiceActionModal({
              image: <img src="/images/modalImages/vestingImage.svg" />,
              title: "Sweet!",
              content:
                "You have just claimed 10% of your earned rewards. The rest of the rewards will be claimable over the next 365 days",
              onConfirm: {
                label: "Continue",
                onClick: () => dispatch(setMultiChoiceActionModal(false)),
              },
              onDismiss: {
                onClick: () => {
                  dispatch(setMultiChoiceActionModal(false));
                },
              },
              onDontShowAgain: {
                label: "Do not remind me again",
                onClick: () => {
                  localStorage.setItem("hideClaimModal", "true");
                  dispatch(setMultiChoiceActionModal(false));
                },
              },
            }),
          );
        }
      },
    );
  };
  return (
    <>
      <div className={`my-4 ${isValidating && !staking && !error ? "show-staking-loading" : " hidden"}`}>
        <ContentLoader viewBox="0 0 450 80" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
          {/*eslint-disable */}
          <rect x="0" y="0" rx="8" ry="8" width="450" height="80" />
          {/*eslint-enable */}
        </ContentLoader>
      </div>
      <div
        className={`hover:scale-102 transition duration-500 ease-in-out transform w-full md:h-48 border-b border-customLightGray ${
          !staking?.earned || staking?.earned?.eq(constants.Zero) ? "hidden" : "show-staking"
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between pt-4 pb-6 md:px-8">
          <div className="flex flex-col justify-between">
            <div className="flex flex-row items-center pl-4 md:pl-0">
              <div className="flex items-center relative">
                <div className="absolute top-0 -left-4">
                  <Image
                    src={networkLogos[chainId]}
                    alt={ChainId[chainId] + " logo"}
                    height="24"
                    width="24"
                    objectFit="contain"
                  />
                </div>
                <TokenIcon token={staking?.stakingToken?.address} chainId={chainId} fullsize />
              </div>
              <h1
                className={`text-2xl md:text-4xl leading-7 md:leading-12 mt-1 ml-4 text-black line-clamp-2 overflow-hidden`}
              >
                {metadata?.name ? metadata.name : staking?.stakingToken?.name}
              </h1>
            </div>
            <div className="my-6 md:my-0">
              <p className="text-primaryLight leading-6">Rewards</p>
              <h1 className={`text-2xl md:text-3xl leading-8 text-primary`}>
                {formatAndRoundBigNumber(staking?.earned, 18)} <span className=" text-tokenTextGray text-xl"> POP</span>
              </h1>
            </div>
          </div>
          <div>
            <MainActionButton
              handleClick={() => {
                poolClaimHandler(staking?.contract, stakingType === StakingType.PopLocker, signer, account);
              }}
              label="Claim"
              disabled={staking?.earned?.eq(constants.Zero)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClaimCard;

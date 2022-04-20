import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { formatAndRoundBigNumber, getTokenOnNetwork } from "@popcorn/utils";
import StatusWithLabel from "components/Common/StatusWithLabel";
import TextLink from "components/Common/TextLink";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import TokenIcon from "components/TokenIcon";
import TokenInputToggle from "components/TokenInputToggle";
import { BigNumber, constants } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import Link from "next/link";
import PopLockerInteraction from "./PopLockerInteraction";
import StakingInteraction, { StakingInteractionProps } from "./StakingInteraction";

interface StakeInterfaceProps extends StakingInteractionProps {
  chainId: number;
  restake?: () => void;
  isPopLocker?: boolean;
}

export interface StakingForm {
  amount: BigNumber;
  type: InteractionType;
  termsAccepted: boolean;
}

export enum InteractionType {
  Deposit,
  Withdraw,
}

export const defaultForm = {
  amount: BigNumber.from("0"),
  type: InteractionType.Deposit,
  termsAccepted: false,
};

export default function StakeInterface({
  stakingPool,
  user,
  form,
  stake,
  withdraw,
  approve,
  onlyView,
  chainId,
  restake,
  isPopLocker,
}: StakeInterfaceProps): JSX.Element {
  const stakingToken = stakingPool?.stakingToken;
  const [state, setState] = form;

  const toggleInterface = () =>
    setState({
      ...defaultForm,
      type: state.type === InteractionType.Deposit ? InteractionType.Withdraw : InteractionType.Deposit,
    });

  return (
    <>
      <div className="md:w-2/3 mx-4 md:mx-0 mt-14">
        <div className="">
          <span className="flex flex-row items-center justify-center md:justify-start">
            <TokenIcon token={stakingToken?.name} />
            <h1 className="ml-3 page-title uppercase">{stakingToken?.name}</h1>
          </span>
          <div className="flex flex-row flex-wrap items-center mt-4 justify-center md:justify-start">
            <div className="pr-6 border-r-2 border-gray-200 mt-2">
              <div className="hidden md:block">
                <StatusWithLabel
                  content={
                    stakingPool?.apy.lt(constants.Zero)
                      ? "New 🍿✨"
                      : formatAndRoundBigNumber(stakingPool?.apy, 2) + "%"
                  }
                  label="Est. APY"
                  green
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={stakingPool ? formatStakedAmount(stakingPool?.totalStake) : "0"}
                  label="Total Staked"
                />
              </div>
            </div>
            <div className="pl-6 xs:px-6 md:border-r-2 border-gray-200 mt-2">
              <div className="hidden md:block">
                <StatusWithLabel
                  content={stakingPool ? formatStakedAmount(stakingPool?.totalStake) : "0"}
                  label="Total Staked"
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={`${stakingPool ? formatAndRoundBigNumber(stakingPool.tokenEmission) : "0"} POP / day`}
                  label="Emission Rate"
                />
              </div>
            </div>
            <div className="mt-2 md:pl-6 text-center md:text-left">
              <div className="hidden md:block ">
                <StatusWithLabel
                  content={`${stakingPool ? formatAndRoundBigNumber(stakingPool.tokenEmission) : "0"} POP / day`}
                  label="Emission Rate"
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={
                    stakingPool?.apy.lt(constants.Zero)
                      ? "New 🍿✨"
                      : formatAndRoundBigNumber(stakingPool?.apy, 2) + "%"
                  }
                  label="Est. APY"
                  green
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row mt-10 mx-4 md:mx-0">
        <div className="md:w-1/3">
          <div className="p-6 border border-gray-200 rounded-3xl shadow-custom mb-10">
            <div className="pt-2">
              <TokenInputToggle
                state={[state.type !== InteractionType.Deposit, toggleInterface]}
                labels={["Stake", "Unstake"]}
              />
            </div>
            {isPopLocker ? (
              <PopLockerInteraction
                stakingPool={stakingPool}
                user={user}
                form={form}
                onlyView={onlyView}
                approve={approve}
                stake={stake}
                withdraw={withdraw}
                restake={restake}
              />
            ) : (
              <StakingInteraction
                stakingPool={stakingPool}
                user={user}
                form={form}
                onlyView={onlyView}
                approve={approve}
                stake={stake}
                withdraw={withdraw}
              />
            )}
          </div>
        </div>

        <div className="md:w-2/3 md:ml-12">
          <div className="rounded-3xl shadow-custom border border-gray-200 w-full">
            <div className="flex flex-col items-center justify-between">
              <div className="flex flex-row justify-between items-end md:items-center py-6 px-8 w-full">
                <div>
                  <div className="inline flex flex-row">
                    <h2 className="text-gray-500 uppercase text-base">Your Staked Balance</h2>
                    <InfoIconWithTooltip
                      classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                      id="1"
                      title="Staked Balance"
                      content={`This shows your staked balance of ${stakingToken?.symbol} which currently farm POP rewards.`}
                    />
                  </div>
                  <div className="flex flex-row items-center mt-1">
                    <p className="text-2xl font-medium  mr-2">
                      {stakingPool.userStake ? formatStakedAmount(stakingPool.userStake) : "0"}
                    </p>
                    <p className="text-2xl font-medium ">{stakingToken?.symbol}</p>
                  </div>
                </div>
                {getTokenOnNetwork(
                  stakingPool.tokenAddress?.toLowerCase(),
                  chainId,
                  getChainRelevantContracts(chainId),
                ) && (
                  <Link
                    href={getTokenOnNetwork(
                      stakingPool.tokenAddress?.toLowerCase(),
                      chainId,
                      getChainRelevantContracts(chainId),
                    )}
                    passHref
                  >
                    <a
                      target="_blank"
                      className="text-lg text-blue-600 font-medium bg-white px-4 py-2 md:px-6 md:py-3 whitespace-nowrap border border-gray-200 rounded-full hover:text-white hover:bg-blue-500"
                    >
                      Get Token
                    </a>
                  </Link>
                )}
              </div>
            </div>
            <div className="bg-blue-50 rounded-b-3xl py-6 px-8">
              <div className="flex flex-row justify-between items-end md:items-center ">
                <div>
                  <div className="inline flex flex-row">
                    <h2 className="text-gray-500 text-base uppercase">Your Staking Rewards</h2>
                    <InfoIconWithTooltip
                      classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                      id="2"
                      title="Your Staking Rewards"
                      content={`Here you can see how much POP you already earned from your staked ${stakingToken?.symbol}`}
                    />
                  </div>
                  <div className="flex flex-row items-center mt-1">
                    <p className="text-2xl font-medium  mr-2">
                      {stakingPool.earned ? formatAndRoundBigNumber(stakingPool.earned) : "0"}
                    </p>
                    <p className="text-2xl font-medium ">POP</p>
                  </div>
                </div>
                <TextLink text="Claim Page" url="/rewards" />
              </div>
            </div>
          </div>
          <div className="relative bg-primaryLight rounded-3xl shadow-custom border border-gray-200 mt-8 w-full h-64 xs:h-72 smmd:h-full md:h-124">
            <div className="mt-8 md:ml-8 text-center md:text-left">
              <p className="text-xl font-medium">Happy Staking</p>
              <p className="text-base font-light mt-1">Enjoy more sweet POP in your wallet!</p>
            </div>
            <img
              src="/images/catPopVault.svg"
              className={"hidden md:block absolute max-h-80 w-3/4 right-10 bottom-1 md:bottom-16"}
            />
            <div className="flex md:hidden w-full justify-center">
              <img
                src="/images/catPopVaultMobile.png"
                className={"block md:hidden max-h-80 w-3/4 bottom-0 pt-10 object-contain"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { formatAndRoundBigNumber } from "@popcorn/utils";
import StatusWithLabel from "components/Common/StatusWithLabel";
import TextLink from "components/Common/TextLink";
import TokenIcon from "components/TokenIcon";
import TokenInputToggle from "components/TokenInputToggle";
import { BigNumber } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import PopLockerInteraction from "./PopLockerInteraction";
import StakingInteraction, { StakingInteractionProps } from "./StakingInteraction";

interface StakeInterfaceProps extends StakingInteractionProps {
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
      <div className="md:w-2/3 mt-14">
        <div className="">
          <span className="flex flex-row items-center justify-center md:justify-start">
            <TokenIcon token={stakingToken?.name} />
            <h1 className="ml-3 page-title uppercase">{stakingToken?.name}</h1>
          </span>
          <div className="flex flex-row flex-wrap items-center mt-4 justify-center md:justify-start">
            <div className="pr-6 border-r-2 border-gray-200 mt-2">
              <div className="hidden md:block">
                <StatusWithLabel
                  content={stakingPool?.apy === "∞" ? "New 🍿✨" : stakingPool?.apy.toLocaleString() + "%"}
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
            <div className="pl-6 md:px-6 md:border-r-2 border-gray-200 mt-2">
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
            <div className="px-6 mt-2 text-center md:text-left">
              <div className="hidden md:block">
                <StatusWithLabel
                  content={`${stakingPool ? formatAndRoundBigNumber(stakingPool.tokenEmission) : "0"} POP / day`}
                  label="Emission Rate"
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={stakingPool?.apy === "∞" ? "New 🍿✨" : stakingPool?.apy.toLocaleString() + "%"}
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
          <div className="pt-4 h-full px-6 border border-gray-200 rounded-3xl shadow-custom mb-10">
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
          <div className="">
            <div className="rounded-3xl shadow-custom border border-gray-200 w-full">
              <div className="h-32 md:h-28 pt-8 px-8">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <h2 className="text-gray-500 uppercase text-base">Your Staked Balance</h2>
                    <div className="flex flex-row items-center mt-1">
                      <p className="text-2xl font-medium  mr-2">
                        {stakingPool.userStake ? formatStakedAmount(stakingPool.userStake) : "0"}
                      </p>
                      <p className="text-2xl font-medium ">{stakingToken?.symbol}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-32 md:h-28 bg-blue-50 rounded-b-3xl py-8 px-8">
                <div className="flex flex-row justify-between items-end md:items-center ">
                  <div>
                    <h2 className="text-gray-500 text-base uppercase">Your Staking Rewards</h2>
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
            <div className="relative bg-primaryLight rounded-3xl shadow-custom border border-gray-200 mt-8 w-full h-64 md:h-124">
              <div className="mt-8 ml-8">
                <p className="text-xl font-medium">Happy Staking</p>
                <p className="text-base font-light mt-1">Enjoy more sweet POP in your wallet!</p>
              </div>
              <img src="/images/catPopVault.svg" className={"absolute max-h-80 w-3/4 right-10 bottom-1 md:bottom-16"} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

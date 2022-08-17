import { ChevronLeftIcon } from "@heroicons/react/solid";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { formatAndRoundBigNumber, getTokenOnNetwork } from "@popcorn/utils";
import MobileCardSlider from "components/Common/MobileCardSlider";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import SecondaryActionButton from "components/SecondaryActionButton";
import TokenIcon from "components/TokenIcon";
import TokenInputToggle from "components/TokenInputToggle";
import { BigNumber, constants } from "ethers";
import { formatStakedAmount, formatStakedTVL } from "helper/formatAmount";
import Link from "next/link";
import PopLockerInteraction from "./PopLockerInteraction";
import StakingInteraction, { StakingInteractionProps } from "./StakingInteraction";

interface StakeInterfaceProps extends StakingInteractionProps {
  stakedTokenPrice: BigNumber;
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
  amount: constants.Zero,
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
  stakedTokenPrice,
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
      <div className="-ml-2">
        <Link href="/staking" passHref>
          <a>
            <div className="flex items-center">
              <ChevronLeftIcon className="w-6 h-6 text-secondaryLight" />
              <p className="text-primary">Staking</p>
            </div>
          </a>
        </Link>
      </div>
      <div className="grid grid-cols-12 mt-12">
        <div className="col-span-12 md:col-span-5">
          <TokenIcon token={stakingToken?.name} />
          <h1 className="text-black text-5xl md:text-6xl leading-12 mt-9">{stakingToken?.name}</h1>
          <div className=" mt-6 md:mt-8">
            <div className="flex justify-between md:justify-start">
              <div className="block pr-6">
                <StatusWithLabel
                  content={
                    stakingPool?.apy.lt(constants.Zero)
                      ? "New 🍿✨"
                      : formatAndRoundBigNumber(stakingPool?.apy, 2) + "%"
                  }
                  label={
                    <>
                      <span className="lowercase">v</span>APR
                    </>
                  }
                  green
                  infoIconProps={{
                    id: "vAPR",
                    title: "vAPR",
                    content: "This is a variable annual percentage rate. 90% of POP rewards are vested over one year.",
                  }}
                />
              </div>
              <div className="block pl-6 md:border-l md:border-customLightGray">
                <StatusWithLabel
                  content={
                    stakingPool && stakedTokenPrice ? formatStakedTVL(stakingPool?.totalStake, stakedTokenPrice) : "..."
                  }
                  label="TVL"
                />
              </div>
            </div>
            <div className="mt-6 md:mt-8">
              <div className="block ">
                <StatusWithLabel
                  content={`${stakingPool ? formatAndRoundBigNumber(stakingPool.tokenEmission) : "0"} POP / day`}
                  label="EMISSION RATE"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-customGreen col-span-12 md:col-span-3 md:col-end-13 h-80 p-6 hidden md:flex justify-end items-end">
          <img src="/images/stakingCard.svg" alt="" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row mt-10">
        <div className="md:w-1/3 order-2 md:order-1">
          <div className="p-6 border border-customLightGray rounded-lg mb-12 mt-12 md:mt-0">
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

        <div className="md:w-2/3 md:ml-8 order-1 md:order-2">
          <div className="w-full md:grid grid-cols-12 gap-8 hidden">
            <div className="rounded-lg border border-customLightGray p-6 pb-4 col-span-12 md:col-span-6">
              <div className="flex gap-6 items-center pb-6">
                <TokenIcon token={stakingToken?.name} imageSize="w-12 h-12" />
                <div>
                  <div className="flex">
                    <h2 className="text-primaryLight leading-5 text-base">Your Staked Balance</h2>
                    <InfoIconWithTooltip
                      classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                      id="1"
                      title="Staked Balance"
                      content={`This is the balance of ${stakingToken?.symbol} that you have staked.`}
                    />
                  </div>
                  <p className="text-primary text-2xl leading-6">
                    {" "}
                    {stakingPool.userStake ? formatStakedAmount(stakingPool.userStake) : "0"} {stakingToken?.symbol}
                  </p>
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
                  <a target="_blank">
                    <div className="border-t border-customLightGray pt-2 px-1">
                      <SecondaryActionButton label="Get Token" />
                    </div>
                  </a>
                </Link>
              )}
            </div>

            <div className="rounded-lg border border-customLightGray p-6 pb-4 col-span-12 md:col-span-6">
              <div className="flex gap-6 items-center pb-6">
                <TokenIcon token={stakingToken?.name} imageSize="w-12 h-12" />
                <div>
                  <div className="flex">
                    <h2 className="text-primaryLight leading-5 text-base">Your Staking Rewards</h2>
                    <InfoIconWithTooltip
                      classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                      id="2"
                      title="Your Staking Rewards"
                      content={`Staking rewards are received for staking tokens. Rewards may be claimed under the rewards page. Whenever rewards are claimed, 10% is transferred immediately to your wallet, and the rest is streamed and claimable over the next 1 year.`}
                    />
                  </div>
                  <p className="text-primary text-2xl leading-6">
                    {" "}
                    {stakingPool.earned ? formatAndRoundBigNumber(stakingPool.earned) : "0"} POP
                  </p>
                </div>
              </div>
              {getTokenOnNetwork(
                stakingPool.tokenAddress?.toLowerCase(),
                chainId,
                getChainRelevantContracts(chainId),
              ) && (
                <Link href="/rewards" passHref>
                  <a target="_blank">
                    <div className="border-t border-customLightGray pt-2 px-1">
                      <SecondaryActionButton label="Claim Page" />
                    </div>
                  </a>
                </Link>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <MobileCardSlider>
              <div className="px-1">
                <div className="rounded-lg border border-customLightGray p-6 col-span-12 md:col-span-6">
                  <div className="flex gap-6">
                    <TokenIcon token={stakingToken?.name} />
                    <div className="pb-6">
                      <div className="flex">
                        <h2 className="text-primaryLight leading-5 text-base">Your Staked Balance</h2>
                        <InfoIconWithTooltip
                          classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                          id="1"
                          title="Staked Balance"
                          content={`This is the balance of ${stakingToken?.symbol} that you have staked.`}
                        />
                      </div>
                      <p className="text-primary text-2xl">
                        {" "}
                        {stakingPool.userStake ? formatStakedAmount(stakingPool.userStake) : "0"} {stakingToken?.symbol}
                      </p>
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
                      <a target="_blank">
                        <div className="border-t border-customLightGray pt-2 px-1">
                          <SecondaryActionButton label="Get Token" />
                        </div>
                      </a>
                    </Link>
                  )}
                </div>
              </div>

              <div className="px-1">
                <div className="rounded-lg border border-customLightGray p-6 col-span-12 md:col-span-6">
                  <div className="flex gap-6">
                    <TokenIcon token={stakingToken?.name} />
                    <div className="pb-6">
                      <div className="flex">
                        <h2 className="text-primaryLight leading-5 text-base">Your Staking Rewards</h2>
                        <InfoIconWithTooltip
                          classExtras="h-5 w-5 mt-0 ml-1 md:ml-2 md:mb-2 p-0"
                          id="2"
                          title="Your Staking Rewards"
                          content={`Staking rewards are received for staking tokens. Rewards may be claimed under the rewards page. Whenever rewards are claimed, 10% is transferred immediately to your wallet, and the rest is streamed and claimable over the next 1 year.`}
                        />
                      </div>
                      <p className="text-primary text-2xl">
                        {" "}
                        {stakingPool.earned ? formatAndRoundBigNumber(stakingPool.earned) : "0"} POP
                      </p>
                    </div>
                  </div>
                  {getTokenOnNetwork(
                    stakingPool.tokenAddress?.toLowerCase(),
                    chainId,
                    getChainRelevantContracts(chainId),
                  ) && (
                    <Link href="/rewards" passHref>
                      <a target="_blank">
                        <div className="border-t border-customLightGray pt-2 px-1">
                          <SecondaryActionButton label="Claim Page" />
                        </div>
                      </a>
                    </Link>
                  )}
                </div>
              </div>
            </MobileCardSlider>
          </div>

          <div className="bg-customRed rounded-lg p-8 hidden md:flex flex-col justify-between mt-8">
            <h2 className=" text-6xl leading-11">
              Blockchain-enabled <br /> wealth management and <br /> social impact.
            </h2>
            <div className="flex justify-end mt-28">
              <img src="/images/hands.svg" alt="" className=" h-28 w-28" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-customRed rounded-lg p-6 flex md:hidden flex-col justify-between">
        <h2 className=" text-2xl leading-6">
          Blockchain-enabled <br /> wealth management and <br /> social impact.
        </h2>
        <div className="flex justify-end mt-2">
          <img src="/images/hands.svg" alt="" className=" h-12 w-12" />
        </div>
      </div>
      <div className="py-6 hidden md:block mt-10">
        <img src="/images/nature.png" alt="" className=" rounded-lg w-full object-cover" />
      </div>
    </>
  );
}

import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId } from "@popcorn/utils";
import SliderContainer from "components/Common/SliderContainer";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import SecondaryActionButton from "components/SecondaryActionButton";
import { constants } from "ethers/lib/ethers";
import { formatUnits } from "ethers/lib/utils";
import useSetTokenTVL from "hooks/set/useSetTokenTVL";
import useStakingTVL from "hooks/staking/useStakingTVL";
import useNetWorth from "hooks/useNetWorth";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function Hero(): JSX.Element {
  const { account, connect } = useWeb3();
  const contractAddresses = getChainRelevantContracts(ChainId.Ethereum);
  const networth = useNetWorth();
  const { data: mainnetStakingTVL } = useStakingTVL(ChainId.Ethereum);
  const { data: polygonStakingTVL } = useStakingTVL(ChainId.Polygon);
  const { data: butterTVL } = useSetTokenTVL(contractAddresses.butter, contractAddresses.butterBatch);
  const { data: threeXTVL } = useSetTokenTVL(contractAddresses.threeX, contractAddresses.threeXBatch);
  const tvl = useMemo(
    () =>
      [mainnetStakingTVL, polygonStakingTVL, butterTVL, threeXTVL].reduce(
        (total, num) => total.add(num ? num : constants.Zero),
        constants.Zero,
      ),
    [mainnetStakingTVL, polygonStakingTVL, butterTVL, threeXTVL],
  );

  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  return (
    <section className="grid grid-cols-12 md:gap-8">
      <div className="col-span-12 md:col-span-3">
        <div className="grid grid-cols-12 w-full gap-4 md:gap-0">
          <div className="col-span-5 md:col-span-12 rounded-lg border border-customLightGray p-6">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <p className="text-primaryLight leading-5 hidden md:block">Total Value Locked </p>
              <p className="text-primaryLight leading-5 md:hidden">TVL </p>
              <InfoIconWithTooltip
                classExtras=""
                id="hero-tvl"
                title="Total value locked (TVL)"
                content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
              />
            </div>
            <p className="text-primary text-xl md:text-4xl leading-5 md:leading-8">
              ${formatter.format(parseInt(formatUnits(tvl)))}
            </p>
          </div>
          {account && (
            <div className="col-span-7 md:col-span-12 rounded-lg border border-customLightGray p-6 md:my-8">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <p className="text-primaryLight leading-5 hidden md:block">My Net Worth</p>
                <p className="text-primaryLight leading-5 md:hidden">MNW</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="hero-mnw"
                  title="Net Worth"
                  content="This value aggregates your Popcorn-related holdings across all blockchain networks."
                />
              </div>
              <p className="text-primary text-xl md:text-4xl leading-5 md:leading-8">
                ${formatter.format(parseInt(formatUnits(networth)))}
              </p>
            </div>
          )}
        </div>
        {!account && (
          <div
            className=" rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0 mt-6 group"
            role="button"
            onClick={() => connect()}
          >
            <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
            <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0  py-6 md:py-2 md:mt-4">
              <SecondaryActionButton label="Connect Wallet" />
            </div>
          </div>
        )}
      </div>

      <div className="col-span-12 md:col-span-4 h-full pt-10 md:pt-0">
        <div className="rounded-lg p-6 md:px-8 md:py-9 bg-customYellow h-full flex flex-row md:flex-col justify-between">
          <p className="text-2xl md:text-8xl leading-6 md:leading-13">
            Connect <br />
            Deposit <br />
            Do well <br />
            Do good
          </p>
          <div className="flex flex-col md:flex-row justify-end">
            <img src="/images/smiley.svg" alt="" />
          </div>
        </div>
      </div>

      <div className="hidden md:block col-span-12 md:col-span-5 h-full">
        <div className="w-full h-full bg-customLightGreen rounded-lg p-10">
          <p className=" text-3xl leading-10">
            Audited. <br />
            Non-custodial. <br />
            Decentralized. <br />
          </p>
          <div className="flex justify-end">
            <img src="/images/hands.svg" alt="" />
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-8 md:col-start-4 pt-6">
        <h6 className=" font-medium leading-8 mb-3">Built With</h6>
        <SliderContainer slidesToShow={4}>
          <img src="/images/builtWithLogos/curve.svg" alt="" className="px-2 md:px-5 w-10 h-10 object-contain" />
          <img src="/images/builtWithLogos/synthetix.svg" alt="" className="px-2 md:px-5 w-10 h-10 object-contain" />
          <img src="/images/builtWithLogos/setLogo.svg" alt="" className="px-2 md:px-5 w-10 h-10 object-contain" />
          <img src="/images/builtWithLogos/yearn.svg" alt="" className="px-2 md:px-5 w-10 h-10 object-contain" />
          <img src="/images/builtWithLogos/uniswap.svg" alt="" className="px-2 md:px-5 w-10 h-10 object-contain" />
        </SliderContainer>
      </div>
    </section>
  );
}

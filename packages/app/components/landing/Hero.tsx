import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import SliderContainer from "@popcorn/app/components/Common/SliderContainer";
import { NetworthCard } from "@popcorn/app/components/landing/NetworthCard";
import { TVLCard } from "@popcorn/app/components/landing/TVLCard";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import { useIsConnected } from "@popcorn/app/hooks/useIsConnected";
import useWeb3 from "@popcorn/app/hooks/useWeb3";

export default function Hero(): JSX.Element {
  const { connect } = useWeb3();
  const isConnected = useIsConnected();
  return (
    <section className="grid grid-cols-12 md:gap-8">
      <div className="col-span-12 md:col-span-3">
        <div className="grid grid-cols-12 w-full gap-4 md:gap-0">
          <TVLCard />
          <NetworthCard hidden={!isConnected} />
        </div>
        <div
          className={`rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0 mt-6 group ${
            isConnected ? "hidden" : ""
          }`}
          role="button"
          onClick={() => connect()}
        >
          <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
          <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0  py-6 md:py-2 md:mt-4">
            <div className="hidden md:block">
              <SecondaryActionButton label="Connect" />
            </div>
            <div className="md:hidden">
              <SecondaryActionButton label="Connect Wallet" />
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 h-full pt-10 md:pt-0">
        <ConnectDepositCard />
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

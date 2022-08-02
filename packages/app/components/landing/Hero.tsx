import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import SecondaryActionButton from "components/SecondaryActionButton";
import useWeb3 from "hooks/useWeb3";

export default function Hero(): JSX.Element {
  const { account, connect } = useWeb3();
  return (
    <section className="grid grid-cols-12 md:gap-8">
      <div className="col-span-12 md:col-span-3">
        <div className="grid grid-cols-12 w-full gap-4 md:gap-0">
          <div className="col-span-5 md:col-span-12 rounded-lg border border-customLightGray p-6">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5 hidden md:block">Total Value Locked </p>
              <p className="text-primaryLight leading-5 md:hidden">TVL </p>

              <InfoIconWithTooltip
                classExtras=""
                id="hero-tvl"
                title="Total value locked (TVL)"
                content="Total value locked (TVL) is the amount of user funds deposited in the 3X contract."
              />
            </div>
            <p className="text-primary text-xl md:text-4xl leading-8">$5.55m</p>
          </div>

          <div className="col-span-7 md:col-span-12 rounded-lg border border-customLightGray p-6 md:my-8">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-primaryLight leading-5 hidden md:block">My Net Worth</p>
              <p className="text-primaryLight leading-5 md:hidden">MNW</p>
              <InfoIconWithTooltip
                classExtras=""
                id="hero-mnw"
                title="Net Worth"
                content="This value aggregates your Popcorn-related holdings across all blockchain networks."
              />
            </div>
            <p className="text-primary text-xl md:text-4xl leading-8">$45,032,100</p>
          </div>
        </div>
        {account && (
          <div className=" rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0">
            <p className="text-gray-900 text-4xl leading-8 hidden md:block">Connect your wallet</p>
            <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-8 md:px-0 py-2  mb-1 md:mt-4">
              <SecondaryActionButton label="Connect" handleClick={() => connect()} />
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
    </section>
  );
}

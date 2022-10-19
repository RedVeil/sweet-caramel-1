import useWeb3 from "hooks/useWeb3";
import SecondaryActionButton from "./SecondaryActionButton";

export const ConnectWallet = () => {
  const { connect } = useWeb3();

  return (
    <div
      className=" rounded-lg md:border md:border-customLightGray px-0 md:p-6 md:pb-0 md:mr-6"
      role="button"
      onClick={() => connect()}
    >
      <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
      <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0 py-6 md:py-2 md:mt-4">
        <div className="hidden md:block">
          <SecondaryActionButton label="Connect" />
        </div>
        <div className="md:hidden">
          <SecondaryActionButton label="Connect Wallet" />
        </div>
      </div>
    </div>
  );
};

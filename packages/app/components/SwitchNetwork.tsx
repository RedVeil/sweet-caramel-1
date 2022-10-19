import useWeb3 from "hooks/useWeb3";
import SecondaryActionButton from "./SecondaryActionButton";

interface SwitchNetworkProps {
  chainId: number;
}
export const SwitchNetwork = ({ chainId }: SwitchNetworkProps) => {
  const { setChain } = useWeb3();

  return (
    <div
      className=" rounded-lg md:border md:border-customLightGray px-0 md:p-6 md:pb-0 md:mr-6"
      role="button"
      onClick={() => setChain(chainId)}
    >
      <p className="text-gray-900 text-3xl leading-8 hidden md:block">Switch network</p>
      <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0 py-6 md:py-2 md:mt-4">
        <div className="hidden md:block">
          <SecondaryActionButton label="The connected network is not supported" />
        </div>
        <div className="md:hidden">
          <SecondaryActionButton label="Switch Network" />
        </div>
      </div>
    </div>
  );
};

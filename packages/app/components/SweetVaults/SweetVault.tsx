import { Dialog, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import SecondaryActionButton from "components/SecondaryActionButton";
import { constants } from "ethers";
import useStakingPool from "hooks/staking/useStakingPool";
import useSweetVault from "hooks/sweetvault/useSweetVault";
import useTokenList from "hooks/sweetvault/useTokenList";
import useVaultsV1Zapper from "hooks/sweetvault/useVaultsV1Zapper";
import useGetMultipleToken from "hooks/tokens/useGetMultipleToken";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { SweetVaultMetadata } from "../../../utils/src/types/index";
import StatusWithLabel from "../Common/StatusWithLabel";
import SweetVaultsDepositInterface from "./SweetVaultsDepositInterface";
import SweetVaultsMobileTutorialSlider from "./SweetVaultsMobileTutorialSlider";
import SweetVaultsSlider from "./SweetVaultsSlider";

export interface SweetVaultProps {
  address: string;
  searchString: string;
}

async function getCoins(zapper, underlyingAddress, provider): Promise<ERC20[]> {
  return await zapper.getCoins(await zapper.getPoolAddress(underlyingAddress, provider), provider);
}

const SweetVault: React.FC<SweetVaultProps> = ({ address, searchString }) => {
  const { signerOrProvider, contractAddresses, account, rpcProvider } = useWeb3();
  const [expanded, setExpanded] = useState<boolean>(false);
  const zapper = useVaultsV1Zapper();
  const [poolCoins, setPoolCoins] = useState<ERC20[]>(null);
  const {
    data: tokenList,
    error: tokenListError,
    mutate: revalidateTokenList,
  } = useTokenList(contractAddresses.defaultTokenList, zapper?.zapper?.address);
  const { data: sweetVault, error: sweetVaultError, mutate: revalidateVault } = useSweetVault(address);
  const { data: stakingPool } = useStakingPool(sweetVault?.metadata?.stakingAdress);
  const {
    data: poolToken,
    error: poolTokenError,
    mutate: revalidatePoolToken,
  } = useGetMultipleToken(poolCoins, zapper?.zapper?.address);
  const [showMobileTutorial, toggleMobileTutorial] = useState<boolean>(false);

  const metadata = sweetVault ? sweetVault.metadata : ({} as SweetVaultMetadata);
  const { name, underlyingToken, deposited, tvl, apy, curveLink, icon, displayText } = metadata;
  const vaultLoading = !sweetVault;

  const stakingApy = formatAndRoundBigNumber(stakingPool?.apy, 3);

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying assets (${apy?.toLocaleString() || "-"
    }%) and is boosted with POP (${stakingApy || "-"
    }%). You must stake your ${name} to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;


  const tutorialSteps = [
    {
      title: "About",
      content: displayText?.token,
    },
    {
      title: "Strategy",
      content: displayText?.strategy,
    },
  ];


  useEffect(() => {
    if (zapper && underlyingToken?.address) {
      getCoins(zapper, underlyingToken?.address, signerOrProvider).then((res) => setPoolCoins(res));
    }
  }, [address, zapper, underlyingToken]);

  async function revalidate(): Promise<void> {
    await Promise.all([revalidateTokenList(), revalidateVault(), revalidatePoolToken()]);
  }

  if (vaultLoading) {
    return (
      <>
        <div className="mt-10">
          <ContentLoader
            className="hidden md:block"
            viewBox="0 0 450 70"
            backgroundColor={"#EBE7D4"}
            foregroundColor={"#d7d5bc"}
          >
            <rect x="0" y="0" rx="8" ry="8" width="450" height="70" />
          </ContentLoader>
          <ContentLoader
            className="md:hidden"
            viewBox="0 0 450 600"
            backgroundColor={"#EBE7D4"}
            foregroundColor={"#d7d5bc"}
          >
            <rect x="0" y="0" rx="8" ry="8" width="450" height="600" />
          </ContentLoader>
        </div>
      </>
    );
  } else if (searchString?.toLocaleLowerCase() && !name?.toLowerCase().includes(searchString?.toLowerCase())) {
    return <></>;
  } else {
    return (
      <div
        className={`${expanded ? " h-160 smlaptop:h-156" : "h-100 md:h-72 delay-200"
          } bg-white border-b border-customLightGray cursor-pointer z-10 py-6 md:p-8 transition-all duration-700 ease-in-out hover:scale-102 transform`}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <div className="w-full flex flex-row flex-wrap md:flex-nowrap items-center justify-between">
          <div className="flex justify-between w-full mb-8 md:mb-0">
            <div className="flex items-center flex-row">
              <img src={icon} alt={`${name}-icon`} className="w-10 h-10" />
              <h3 className=" text-4xl leading-10 ml-2 ">{name}</h3>
            </div>
            <ChevronDownIcon
              className={`${expanded ? "rotate-180" : "rotate-0"
                } transform transition-all ease-in-out w-6 text-secondaryLight`}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 md:gap-x-10 gap-y-6 mt-6 relative z-30 bg-white">
          <div className="col-span-12 md:col-span-6">
            <StatusWithLabel
              content={formatAndRoundBigNumber(underlyingToken?.balance, underlyingToken?.decimals)}
              label="Your Wallet"
              green
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <StatusWithLabel
              content={formatAndRoundBigNumber(deposited, sweetVault?.metadata?.decimals)}
              label="Your Deposit"
            />
          </div>
          <div className="col-span-6 md:col-span-6">
            <StatusWithLabel
              content={(apy + Number(stakingApy))?.toLocaleString() + "%"}
              label="Est apy."
              infoIconProps={{
                id: "vAPR",
                title: "How we calculate the vAPR",
                content: apyInfoText,
              }}
            />
          </div>
          <div className="col-span-6 md:col-span-6">
            <StatusWithLabel content={"$" + formatAndRoundBigNumber(tvl, 18)} label="tvl" />
          </div>
        </div>
        <Transition
          show={expanded}
          enter="translate transition duration-500 delay-200 ease-in"
          enterFrom="transform -translate-y-10 md:-translate-y-16 opacity-0"
          enterTo="transform translate-y-0 opacity-100"
          leave="translate transition duration-500 ease-out"
          leaveFrom="transform translate-y-0 opacity-100"
          leaveTo="transform -translate-y-10 md:-translate-y-16 opacity-0"
        >
          <div className={`mt-10 max-h-2xl grid grid-cols-12 md:gap-8`} onClick={(e) => e.stopPropagation()}>
            {tokenList?.length && (
              <div className="col-span-12 md:col-span-6">
                <SweetVaultsDepositInterface
                  sweetVault={sweetVault}
                  zapper={zapper}
                  poolToken={poolToken}
                  defaultTokenList={tokenList?.filter((stable) => stable.balance.gt(constants.Zero))}
                  revalidate={revalidate}
                />
              </div>
            )}
            <div className="col-span-12 md:col-span-6">
              <div className="hidden md:block">
                <SweetVaultsSlider tutorialSteps={tutorialSteps} />
              </div>
              <div onClick={(e) => e.stopPropagation()} className="flex gap-6 md:gap-0 md:space-x-6">
                {curveLink && (
                  <Link href={curveLink} passHref>
                    <a className="block border border-customLightGray rounded-lg px-6 py-6 mt-8 basis-1/2 md:basis-full">
                      <div className="hidden md:block">
                        <SecondaryActionButton label="Get token" />
                      </div>
                      <div className="md:hidden">
                        <SecondaryActionButton label="Buy" />
                      </div>
                    </a>
                  </Link>
                )}
                <div className="md:hidden border border-customLightGray rounded-lg px-6 py-6 mt-8 basis-1/2">
                  <SecondaryActionButton label="Learn" handleClick={() => toggleMobileTutorial(true)} />
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition.Root show={showMobileTutorial} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 overflow-hidden z-40" onClose={() => toggleMobileTutorial(false)}>
            <Dialog.Overlay className="absolute inset-0 overflow-hidden">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="w-screen">
                  <SweetVaultsMobileTutorialSlider
                    tutorialSteps={tutorialSteps}
                    onCloseMenu={(e) => {
                      e.stopPropagation();
                      toggleMobileTutorial(false);
                    }}
                  />
                </div>
              </Transition.Child>
            </Dialog.Overlay>
          </Dialog>
        </Transition.Root>
      </div>
    );
  }
};
export default SweetVault;

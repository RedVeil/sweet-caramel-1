import { Transition } from "@headlessui/react";
import { ERC20 } from "@popcorn/hardhat/typechain";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { constants } from "ethers";
import useSweetVault from "hooks/sweetvault/useSweetVault";
import useTokenList from "hooks/sweetvault/useTokenList";
import useZeroXZapper from "hooks/sweetvault/useZeroXZapper";
import useGetMultipleToken from "hooks/tokens/useGetMultipleToken";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { SweetVaultMetadata } from "../../../utils/src/types/index";
import StatusWithLabel from "../Common/StatusWithLabel";
import MainActionButton from "../MainActionButton";
import SweetVaultInfoBox from "./SweetVaultInfoBox";
import SweetVaultsDepositInterface from "./SweetVaultsDepositInterface";
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
  const zapper = useZeroXZapper();
  const [poolCoins, setPoolCoins] = useState<ERC20[]>(null);
  const {
    data: tokenList,
    error: tokenListError,
    mutate: revalidateTokenList,
  } = useTokenList(contractAddresses.defaultTokenList, zapper?.zapper?.address);
  const { data: sweetVault, error: sweetVaultError, mutate: revalidateVault } = useSweetVault(address);
  const {
    data: poolToken,
    error: poolTokenError,
    mutate: revalidatePoolToken,
  } = useGetMultipleToken(poolCoins, zapper?.zapper?.address);

  const vaultLoading = !sweetVault;

  const metadata = sweetVault ? sweetVault.metadata : ({} as SweetVaultMetadata);
  const { name, underlyingToken, deposited, tvl, apy, curveLink, icon, displayText } = metadata;

  async function revalidate(): Promise<void> {
    await Promise.all([revalidateTokenList(), revalidateVault(), revalidatePoolToken()]);
  }

  useEffect(() => {
    if (zapper && underlyingToken?.address) {
      getCoins(zapper, underlyingToken?.address, signerOrProvider).then((res) => setPoolCoins(res));
    }
  }, [address, zapper, underlyingToken]);

  if (vaultLoading) {
    return (
      <>
        <ContentLoader className="hidden md:block" viewBox="0 0 450 70">
          <rect x="0" y="0" rx="10" ry="10" width="450" height="70" />
        </ContentLoader>
        <ContentLoader className="md:hidden" viewBox="0 0 450 600">
          <rect x="0" y="0" rx="10" ry="10" width="450" height="600" />
        </ContentLoader>
      </>
    );
  } else if (searchString?.toLocaleLowerCase() && !name?.toLowerCase().includes(searchString?.toLowerCase())) {
    return <></>;
  } else {
    return (
      <div
        className={`${
          expanded
            ? "bg-white rounded-3xl border border-gray-200 shadow-custom cursor-pointer h-200 smlaptop:h-138"
            : "card h-104 md:h-60 delay-200"
        } z-10 bg-gray-50 p-6 md:p-8 transition-all duration-700 ease-in-out`}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <div className="w-full flex flex-row flex-wrap md:flex-nowrap items-center justify-between">
          <div className="flex flex-col w-full overflow-visible mb-8 md:mb-0">
            <div className="flex items-center flex-row">
              <div className="flex items-center rounded-full bg-white border border-gray-300 w-6 h-6 md:w-12 md:h-12 flex-shrink-0 flex-grow-0">
                <img src={icon} alt={`${name}-icon`} className="w-3 h-3 md:w-7 md:h-7 mx-auto md:ml-2.5" />
              </div>
              <h3 className="secondary-title ml-4 ">{name}</h3>
            </div>
            <div className="flex flex-row flex-wrap items-center md:items-start mt-6 justify-between relative z-30 bg-gray-50">
              <div className="w-1/2 flex flex-col md:items-start md:w-1/4 mt-4">
                <StatusWithLabel
                  content={formatAndRoundBigNumber(underlyingToken?.balance)}
                  label="Your Wallet"
                  green
                />
              </div>
              <div className="w-1/2 flex flex-col md:items-start md:w-1/4 mt-4">
                <StatusWithLabel content={formatAndRoundBigNumber(deposited)} label="Your Deposit" />
              </div>
              <div className="w-1/2 flex flex-col md:items-start md:w-1/4 mt-4">
                <StatusWithLabel content={apy?.toLocaleString() + "%"} label="Est apy." />
              </div>
              <div className="w-1/2 flex flex-col md:items-start md:w-1/4 mt-4">
                <StatusWithLabel content={"$" + formatAndRoundBigNumber(tvl)} label="tvl" />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:w-auto w-full h-full self-start ">
            <div
              onClick={(e) => e.stopPropagation()}
              className="whitespace-nowrap mb-4 md:mb-0 md:mr-4 flex flex-row w-full h-full"
            >
              {curveLink && (
                <Link href={curveLink} passHref>
                  <a
                    className="w-full h-hull mb-3 sm:mb-0 py-3 px-6 flex flex-row items-center justify-center rounded-full bg-white border border-blue-600 text-blue-600 font-medium hover:bg-blue-600 hover:text-white disabled:bg-gray-300"
                    target="_blank"
                  >
                    Get Token
                  </a>
                </Link>
              )}
            </div>
            <div className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
              <MainActionButton label="Deposit/Withdraw" handleClick={async () => setExpanded(true)} />
            </div>
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
          <div className={`mt-10 max-h-2xl w-full flex flex-col md:flex-row`} onClick={(e) => e.stopPropagation()}>
            {tokenList?.length && (
              <SweetVaultsDepositInterface
                sweetVault={sweetVault}
                zapper={zapper}
                poolToken={poolToken}
                defaultTokenList={tokenList?.filter((stable) => stable.balance.gt(constants.Zero))}
                revalidate={revalidate}
              />
            )}
            <div onClick={(e) => e.stopPropagation()} className={`w-full flex flex-col space-y-8 mt-8 md:mt-0`}>
              <SweetVaultInfoBox titleText="About" bodyText={displayText?.token} />
              <SweetVaultInfoBox titleText="Strategy" bodyText={displayText?.strategy} />
            </div>
          </div>
        </Transition>
      </div>
    );
  }
};

export default SweetVault;

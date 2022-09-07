import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import ConnectDepositCard from "components/Common/ConnectDepositCard";
import SearchBar from "components/SearchBar";
import Pagination from "components/SweetVaults/Pagination";
import SweetVault from "components/SweetVaults/SweetVault";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import useWeb3 from "hooks/useWeb3";
import React, { useContext, useEffect, useState } from "react";

export default function index(): JSX.Element {
  const {
    signerOrProvider,
    account,
    chainId,
    onContractSuccess,
    onContractError,
    contractAddresses,
    connect,
    setChain,
    pushWithinChain,
    signer,
  } = useWeb3();
  const { dispatch } = useContext(store);
  const [searchValue, setSearchValue] = useState("");
  const [currentVaults, setCurrentVaults] = useState<string[]>();
  const [slicePosition, setSlicePosition] = useState<number>(0);
  const sliceAmount = 4;

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, Sweet Vaults is only available on Ethereum.",
          onConfirm: {
            label: "Switch Network",
            onClick: () => {
              setChain(ChainId.Ethereum);
              dispatch(setDualActionWideModal(false));
            },
          },
          onDismiss: {
            label: "Go Back",
            onClick: () => {
              pushWithinChain("/");
              dispatch(setDualActionWideModal(false));
            },
          },
          keepOpen: true,
        }),
      );
    } else {
      dispatch(setDualActionWideModal(false));
    }
  }, [signerOrProvider, account, chainId]);

  useEffect(() => {
    updateCurrentPage(slicePosition);
  }, [contractAddresses?.sweetVaults]);

  const updateCurrentPage = (e) => {
    if (contractAddresses.sweetVaults && contractAddresses.sweetVaults.length >= e) {
      setSlicePosition(e);
      let vaults = [...contractAddresses?.sweetVaults];
      setCurrentVaults(vaults.splice(e, sliceAmount));
    }
  };

  return (
    <div className="pb-40">
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-4">
          <h1 className="text-6xl leading-12 text-black">Sweet Vaults</h1>
          <p className="mt-4 leading-5 text-primaryDark">These vaults are like candy</p>
        </div>
        <div className="col-span-12 md:col-span-6 md:col-end-13">
          <div className="rounded-lg bg-customRed hidden md:flex flex-col justify-between p-8 w-full h-full">
            <h2 className=" text-4xl leading-10">
              Blockchain-enabled <br /> wealth management <br />
              and social impact.
            </h2>
            <div className="flex justify-end mt-14">
              <img src="/images/sweetVaults.svg" className="" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 md:gap-10 mt-10 md:mt-20">
        <div className="col-span-12 md:col-span-4 mb-12 md:mb-0">
          <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} />
          <ConnectDepositCard extraClasses="md:h-104 mt-10" />
        </div>
        <div className="col-span-12 md:col-span-8 space-y-6 border-t border-customLightGray">
          <div className="hidden md:block">
            {currentVaults?.map((address) => (
              <SweetVault key={address} address={address} searchString={searchValue} />
            ))}
          </div>
          <div className="md:hidden">
            {contractAddresses?.sweetVaults?.map((address) => (
              <SweetVault key={address} address={address} searchString={searchValue} />
            ))}
          </div>
          <div className="hidden md:block">
            {contractAddresses?.sweetVaults?.length && (
              <Pagination
                sliceAmount={sliceAmount}
                onUpdatePage={(e) => updateCurrentPage(e)}
                lengthOfData={contractAddresses?.sweetVaults?.length}
                currentIndex={slicePosition}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

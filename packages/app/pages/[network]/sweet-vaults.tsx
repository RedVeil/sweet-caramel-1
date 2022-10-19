import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import ConnectDepositCard from "components/Common/ConnectDepositCard";
import SearchBar from "components/SearchBar";
import Pagination from "components/SweetVaults/Pagination";
import SweetVault from "components/SweetVaults/SweetVault";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { useSweetVaults } from "hooks/useSweetVaults";
import useWeb3 from "hooks/useWeb3";
import React, { useContext, useEffect, useState } from "react";
import { useChainIdFromUrl } from "../../hooks/useChainIdFromUrl";

export default function index(): JSX.Element {
  const { signerOrProvider, account, setChain, pushWithinChain } = useWeb3();
  const chainId = useChainIdFromUrl();
  const { dispatch } = useContext(store);
  const [searchValue, setSearchValue] = useState("");
  const [currentVaults, setCurrentVaults] = useState<string[]>();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const sliceAmount = 4;
  const sweetVaults = useSweetVaults(chainId);

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, Sweet Vaults is only available on Ethereum.",
          image: <img src="/images/modalImages/comingSoon.svg" />,
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
    updateCurrentPage(currentPage);
  }, [sweetVaults]);

  const updateCurrentPage = (e) => {
    if (sweetVaults && sweetVaults.length >= e) {
      let vaults = [...sweetVaults];
      setCurrentVaults(vaults.slice(e, e + sliceAmount));
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
            <h2 className=" text-4xl leading-10">{/* removed text for now - @am */}</h2>
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
              <SweetVault chainId={chainId} key={address} address={address} searchString={searchValue} />
            ))}
          </div>
          <div className="md:hidden">
            {sweetVaults?.map((address) => (
              <SweetVault chainId={chainId} key={address} address={address} searchString={searchValue} />
            ))}
          </div>
          <div className="hidden md:block">
            {sweetVaults?.length && (
              <Pagination
                sliceAmount={sliceAmount}
                onUpdatePage={(e) => updateCurrentPage(e)}
                lengthOfData={sweetVaults?.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

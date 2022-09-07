import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import SearchBar from "components/SearchBar";
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

  return (
    <div className="pb-40">
      <div className="text-center md:text-left md:w-1/3">
        <h1 className="page-title">Sweet Vaults</h1>
        <p className="md:text-lg text-gray-500 mt-4">These vaults are like candy</p>
        <div className="mt-10 md:mt-16 flex w-full md:w-112">
          <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} />
        </div>
      </div>
      <div className="flex flex-row mt-10 md:mt-12">
        <div className="w-full flex flex-col md:h-128">
          <div className="space-y-6">
            {contractAddresses?.sweetVaults?.map((address) => (
              <SweetVault key={address} address={address} searchString={searchValue} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

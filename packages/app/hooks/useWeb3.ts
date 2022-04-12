import { Web3Provider } from "@ethersproject/providers";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";
import walletSelectInterface from "components/WalletSelectInterface";
import { setSingleActionModal, setWalletSelectModal } from "context/actions";
import { store } from "context/store";
import { networkMap, Wallets, walletToConnector } from "context/Web3/connectors";
import useWeb3Callbacks from "helper/useWeb3Callbacks";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import useIsContractReady from "./useIsContractReady";

const getChain = (localstorage, envVar) => {
  if (!!localstorage) {
    return parseInt(localstorage);
  }
  return parseInt(envVar || "4");
};

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return `You're connected to an unsupported network. Please connect to ${networkMap[Number(process.env.CHAIN_ID)]}.`;
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

const getChainFromStorage = () => {
  return typeof localStorage !== "undefined" && localStorage?.getItem("chainId");
};

const getWalletFromStorage = () => {
  return typeof localStorage !== "undefined" && localStorage?.getItem("cached_wallet");
};

export default function useWeb3() {
  const { dispatch } = useContext(store);
  const cachedWallet = getWalletFromStorage();
  const [selectedWallet, setSelectedWallet] = useState<Wallets>(cachedWallet ? Number(cachedWallet) : Wallets.METAMASK);

  const { library, account, chainId: _chainId, activate, deactivate, error } = useWeb3React<Web3Provider>();

  const ref = useRef(getChain(getChainFromStorage(), process.env.CHAIN_ID));
  const [chainId, setChainId] = useState(ref.current);

  useEffect(() => {
    if (error) {
      dispatch(
        setSingleActionModal({
          content: getErrorMessage(error),
          title: "Wallet Error",
          visible: true,
          type: "error",
          onConfirm: {
            label: "Close",
            onClick: () => dispatch(setSingleActionModal(false)),
          },
        }),
      );
    }
  }, [error]);

  const chooseWallet = useCallback(
    async (chosenWallet: number) => {
      dispatch(setWalletSelectModal(false));
      localStorage &&
        typeof localStorage !== "undefined" &&
        localStorage?.setItem("cached_wallet", chosenWallet.toString());
      localStorage?.setItem("eager_connect", "true");
      await activate(walletToConnector[chosenWallet]);
      setSelectedWallet(chosenWallet);
    },
    [selectedWallet, setSelectedWallet, account],
  );

  const showModal = useCallback(() => {
    dispatch(
      setWalletSelectModal({
        children: walletSelectInterface(chooseWallet, deactivate),
        onDismiss: {
          label: "Dismiss",
          onClick: () => {
            dispatch(setWalletSelectModal(false));
          },
        },
      }),
    );
  }, []);

  // we set the chainId here explicitly, because if the user disconnects their wallet the chainId will be undefined, but the rest of the app would need the currently selected chainId
  useEffect(() => {
    if (!_chainId) {
      setChainId(ref.current);
    } else if (_chainId !== ref.current) {
      ref.current = _chainId;
      localStorage.setItem("chainId", String(_chainId));
      setChainId(_chainId);
    }
  }, [_chainId]);

  const signer = useMemo(() => (account ? library.getSigner(account) : null), [account, library]);
  const contractAddresses = useMemo(() => getChainRelevantContracts(chainId), [chainId]);
  const { onSuccess: onContractSuccess, onError: onContractError } = useWeb3Callbacks();
  const isContractReady = useIsContractReady();
  return {
    library,
    account,
    chainId,
    activate,
    deactivate,
    signer,
    contractAddresses,
    onContractSuccess,
    onContractError,
    isContractReady,
    showModal,
    selectedWallet,
  };
}

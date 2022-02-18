import { Web3Provider } from "@ethersproject/providers";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { useWeb3React } from "@web3-react/core";
import useWeb3Callbacks from "helper/useWeb3Callbacks";
import { useEffect, useMemo, useRef, useState } from "react";
import useIsContractReady from "./useIsContractReady";

const getChain = (localstorage, envVar) => {
  if (!!localstorage) {
    return parseInt(localstorage);
  }
  return parseInt(envVar || "4");
};

const getChainFromStorage = () => {
  return typeof localStorage !== "undefined" && localStorage?.getItem("chainId");
};

export default function useWeb3() {
  const { library, account, chainId: _chainId, activate, deactivate } = useWeb3React<Web3Provider>();

  const ref = useRef(getChain(getChainFromStorage(), process.env.CHAIN_ID));
  const [chainId, setChainId] = useState(ref.current);

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
  };
}

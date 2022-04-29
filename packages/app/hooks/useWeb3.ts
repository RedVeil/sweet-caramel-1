import { Web3Provider } from "@ethersproject/providers";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ethers } from "@popcorn/hardhat/node_modules/ethers/lib";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";
import { useWeb3React } from "@web3-react/core";
import activateRPCNetwork from "helper/activateRPCNetwork";
import { getStorage, removeStorage, setStorage } from "helper/safeLocalstorageAccess";
import useWeb3Callbacks from "helper/useWeb3Callbacks";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

export default function useWeb3() {
  const router = useRouter();
  const [{ connecting, wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const { activate, deactivate, library } = useWeb3React<Web3Provider>();

  const walletProvider = useMemo(
    () => (wallet?.provider ? new ethers.providers.Web3Provider(wallet?.provider, "any") : null),
    [wallet?.provider],
  );
  const signer = useMemo(() => (walletProvider ? walletProvider.getSigner() : null), [walletProvider]);

  const signerOrProvider = signer || library;
  const connectedAccount = wallet?.accounts[0];
  const accountAddress = connectedAccount?.address;

  const contractAddresses = useMemo(() => getChainRelevantContracts(getChainId()), [getChainId()]);
  const { onSuccess: onContractSuccess, onError: onContractError } = useWeb3Callbacks(getChainId());

  const wallets = useWallets();
  useEffect(() => {
    setStorage("connectedWallets", JSON.stringify(wallets.map(({ label }) => label)));
  }, [wallets]);

  useEffect(() => {
    if (!getStorage("rpcChainId")) {
      setStorage("rpcChainId", process.env.CHAIN_ID);
    }
    if (!wallet) {
      activateRPCNetwork(activate, Number(getStorage("rpcChainId")));
    }
  }, [wallet]);

  useEffect(() => {
    if (!wallet && previouslyConnectedWallets?.length > 0) {
      handleConnect();
    }
  }, []);

  const previouslyConnectedWallets = JSON.parse(getStorage("connectedWallets"));
  return {
    account: accountAddress,
    chainId: getChainId(),
    connect: handleConnect(),
    disconnect: async () => {
      removeStorage("connectedWallets");
      await disconnect({ label: wallet?.label });
    },
    connecting,
    signerOrProvider,
    signer: !signerOrProvider || "getSigner" in signerOrProvider ? null : signerOrProvider,
    contractAddresses,
    onContractSuccess,
    onContractError,
    chains,
    setChain: (newChainId) => setChainFromNumber(newChainId),
    settingChain,
    wallet,
  };

  function handleConnect() {
    return async () => {
      previouslyConnectedWallets ? await connect({ autoSelect: previouslyConnectedWallets[0] }) : await connect({});
      if (wallet) {
        deactivate();
      }
    };
  }

  function getChainId() {
    return Number(connectedChain?.id) || Number(getStorage("rpcChainId"));
  }

  function setChainFromNumber(newChainId: number) {
    setStorage("rpcChainId", String(newChainId));
    if (wallet) {
      setChain({ chainId: ethers.utils.hexStripZeros(ethers.utils.hexlify(newChainId)) });
    } else {
      router.reload();
    }
  }
}

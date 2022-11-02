import { ChainId, HexToChain, PRC_PROVIDERS } from "@popcorn/utils";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";
import { ethers } from "ethers";
import { getStorage, removeStorage, setStorage } from "@popcorn/app/helper/safeLocalstorageAccess";
import toTitleCase from "@popcorn/app/helper/toTitleCase";
import useWeb3Callbacks from "@popcorn/app/helper/useWeb3Callbacks";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";

export default function useWeb3() {
  const router = useRouter();
  const [{ connecting, wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain: _connectedChain, settingChain }, setChain] = useSetChain();
  const [awaitingChainChange, setAwaitingChainChange] = useState<number | false>(false);
  const [connectedChainId, setConnectedChainId] = useState<ChainId>();

  const inGnosisApp = () =>
    typeof document !== "undefined" && document?.location?.ancestorOrigins?.contains("https://gnosis-safe.io");

  useEffect(() => {
    if (typeof _connectedChain?.id == "string" && HexToChain[_connectedChain.id] !== connectedChainId) {
      setConnectedChainId(HexToChain[_connectedChain.id]);
    }
  }, [connectedChainId, _connectedChain]);

  const walletProvider = useMemo(
    () => (wallet?.provider ? new ethers.providers.Web3Provider(wallet?.provider, "any") : null),
    [wallet?.provider],
  );
  const signer = useMemo(() => (walletProvider ? walletProvider.getSigner() : null), [walletProvider]);
  const signerOrProvider = signer || getCurrentRpcProvider();
  const connectedAccount = wallet?.accounts[0];
  const accountAddress = connectedAccount?.address;
  const contractAddresses = useDeployment(connectedChainId);
  const wallets = useWallets();
  const { onSuccess: onContractSuccess, onError: onContractError } = useWeb3Callbacks(connectedChainId);

  useEffect(() => {
    // Eagerconnect
    if (!wallet && inGnosisApp()) {
      connect({ autoSelect: { label: "Gnosis Safe", disableModals: true } });
    } else if (!wallet && previouslyConnectedWallets?.length > 0) {
      handleConnect(true);
    }
  }, []);

  useEffect(() => {
    // Track Connected wallets for eagerconnect
    if (wallets?.length > 0) {
      setStorage("connectedWallets", JSON.stringify(wallets.map(({ label }) => label)));
    }
  }, [wallets]);

  useEffect(() => {
    // Navigate to new URL after chain is switched in wallet
    if (awaitingChainChange) {
      if (_connectedChain.id === idToHex(awaitingChainChange)) {
        pushNetworkChange(ChainId[awaitingChainChange], true);
      }
      setAwaitingChainChange(false);
    }
  }, [_connectedChain?.id]);

  const pushWithinChain = useCallback(
    (url, shallow = false) =>
      router.push(
        {
          pathname: `/${router?.query?.network ||
            ChainId[connectedChainId]?.toLowerCase() ||
            ChainId[ChainId.Ethereum].toLowerCase()
            }${url}`,
        },
        undefined,
        {
          shallow: shallow,
        },
      ),
    [router, router?.query?.network],
  );

  const previouslyConnectedWallets = JSON.parse(getStorage("connectedWallets"));

  return {
    account: accountAddress,
    connectedChainId,
    connectedChain: _connectedChain,
    connect: handleConnect,
    disconnect: handleDisconnect,
    connecting,
    signerOrProvider,
    rpcProvider: getCurrentRpcProvider(),
    signer: !signerOrProvider || "getSigner" in signerOrProvider ? null : signerOrProvider,
    contractAddresses,
    onContractSuccess,
    onContractError,
    chains,
    setChain: (newChainId: number) => setChainFromNumber(newChainId),
    settingChain,
    wallet,
    pushWithinChain,
  };

  async function handleDisconnect(): Promise<void> {
    removeStorage("connectedWallets");
    await disconnect({ label: wallet?.label });
  }

  async function handleConnect(disableModals: boolean = false): Promise<void> {
    return previouslyConnectedWallets
      ? await connect({ autoSelect: { label: previouslyConnectedWallets[0], disableModals } })
      : await connect({ autoSelect: { label: "all", disableModals: false } });
  }

  function getNonWalletChain(): string {
    return typeof router?.query?.network === "string"
      ? toTitleCase(router.query.network)
      : ChainId[Number(process.env.CHAIN_ID)];
  }

  function getChainId(): number {
    return Number(_connectedChain?.id) || ChainId.Ethereum;
  }

  async function setChainFromNumber(newChainId: number): Promise<void> {
    if (wallet || (_connectedChain?.id && String(newChainId) !== _connectedChain?.id)) {
      await setChain({ chainId: idToHex(newChainId) }).then(() => setAwaitingChainChange(newChainId));
    } else {
      await pushNetworkChange(ChainId[newChainId], true);
    }
  }

  function getCurrentRpcProvider() {
    return PRC_PROVIDERS[getChainId()];
  }

  function idToHex(newChainId: number): string {
    return ethers.utils.hexStripZeros(ethers.utils.hexlify(newChainId));
  }

  async function pushNetworkChange(network: string, shallow: boolean): Promise<boolean> {
    return router.push(
      { pathname: router.pathname, query: { ...router.query, network: network.toLowerCase() } },
      undefined,
      {
        shallow: shallow,
      },
    );
  }
}

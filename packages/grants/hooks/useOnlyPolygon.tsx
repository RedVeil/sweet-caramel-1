import { useEffect, useContext } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { ChainId, isChainIdPolygonOrLocal } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import { useRouter } from "next/router";
import toTitleCase from "helper/toTitleCase";
import { store } from "context/store";
import { setSingleActionModal } from "context/actions";
import Button from "components/CommonComponents/Button";
import { useSetChain } from "@web3-onboard/react";

export const useOnlyPolygon = () => {
  const router = useRouter();
  const context = useWeb3React<Web3Provider>();
  const { account, chainId, deactivate } = context;
  const { dispatch } = useContext(store);
  const [, setChain] = useSetChain();


  function getNonWalletChain(): string {
    return typeof router?.query?.network === "string"
      ? toTitleCase(router.query.network)
      : ChainId[Number(process.env.CHAIN_ID)];
  }

  function getChainId(): number {
    const nonWalletChain = getNonWalletChain();
    return chainId || ChainId[nonWalletChain as keyof typeof ChainId] || Number(process.env.CHAIN_ID);
  }

  const currentUserChainId = getChainId();


  useEffect(() => {
    if (!account || !currentUserChainId) {
      return;
    }
    if (!isChainIdPolygonOrLocal(currentUserChainId)) {
      dispatch(
        setSingleActionModal({
          image: <img src="/images/inconsistentNetwork.svg" />,
          title: "Network Inconsistency",
          visible: true,
          children: (
            <>
              <p className="pt-2 text-primaryDark leading-[140%]">Popcorn Grants operates on the Polygon network. Please switch your network to gain access</p>
              <Button
                variant="primary"
                className="w-full mt-10"
                onClick={() => {
                  setChain(ChainId.Polygon as any);
                  dispatch(setSingleActionModal({ visible: false }))
                }}
              >
                Switch to Polygon
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  deactivate();
                  dispatch(setSingleActionModal({ visible: false }))
                }}
              >
                Disconnect Wallet
              </Button>
            </>
          ),
          onDismiss: {
            onClick: () => dispatch(setSingleActionModal({ visible: false })),
          },
        })
      );
    } else {
      dispatch(setSingleActionModal({ visible: false }))
    }
  }, [account, chainId]);
}
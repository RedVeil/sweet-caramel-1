<<<<<<<< HEAD:packages/grants/components/SwapChainModal.tsx
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useContext, useEffect } from "react";
import { setSingleActionModal } from "../context/actions";
import { store } from "../context/store";
import { networkMap } from "../context/Web3/connectors";
========
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect } from "react";
import { setSingleActionModal } from "../context/actions";
import { store } from "../context/store";
import { networkMap, supportedChainIds } from "../context/Web3/connectors";
>>>>>>>> production:packages/app/components/SwapChainModal.tsx

const SwapChainModal: React.FC = () => {
  const { account, chainId } = useWeb3();
  const { dispatch } = useContext(store);

  useEffect(() => {
    if (account && chainId !== Number(process.env.CHAIN_ID || 31337)) {
      dispatch(
        setSingleActionModal({
          content: `The network selected in your wallet is not supported. Please switch to ${
            networkMap[Number(process.env.CHAIN_ID)]
          }.`,
          title: "Network Error",
          visible: true,
          type: "error",
          onConfirm: {
            label: "Close",
            onClick: () => dispatch(setSingleActionModal(false)),
          },
        }),
      );
    }
  }, [chainId, account]);

  return <></>;
};
export default SwapChainModal;

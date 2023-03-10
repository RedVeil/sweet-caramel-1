import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useContext, useEffect } from "react";
import { setSingleActionModal } from "../context/actions";
import { store } from "../context/store";
import { ChainId, networkMap } from "@popcorn/utils";

const SwapChainModal: React.FC = () => {
  const context = useWeb3React<Web3Provider>();
  const { account, chainId } = context;
  const { dispatch } = useContext(store);

  useEffect(() => {
    if (account && chainId !== Number(process.env.CHAIN_ID || 31337 || 1337)) {
      dispatch(
        setSingleActionModal({
          content: `The network selected in your wallet is not supported. Please switch to ${
            networkMap[Number(process.env.CHAIN_ID) as ChainId]
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

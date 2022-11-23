import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Modal from 'components/Modal';
import { useState } from 'react';
import { useEffect } from 'react';

export default function SwapChainModal(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { library, account, activate, active, chainId } = context;
  const [showModal, setShowModal] = useState<boolean>(false);
  useEffect(() => {
    if (account && chainId !== Number(process.env.CHAIN_ID || 31337)) {
      setShowModal(true);
    }
  }, [chainId, account]);
  return (
    showModal && (
      <Modal>
        <>
          <p>
            We currently do not support this network. Please change your network
            to rinkeby.
          </p>
          <button
            className="button button-primary mx-auto mt-4 w-20"
            onClick={() => setShowModal(false)}
          >
            Ok
          </button>
        </>
      </Modal>
    )
  );
}

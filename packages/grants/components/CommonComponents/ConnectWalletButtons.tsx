import React from "react";
import DisconnectWalletIcon from "../Svgs/DisconnectWalletIcon";
import WalletIcon from "../Svgs/WalletIcon";
import Button from 'components/CommonComponents/Button';
interface Props {
  connected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
}
const ConnectWalletButtons: React.FC<Props> = ({ connected, connectWallet, disconnectWallet }) => {
  return (
    <>
      {!connected && (
        <Button
          variant="primary"
          onClick={connectWallet}
        >
          <span className="hidden md:inline">Connect Wallet</span>
          <span className="md:hidden">
            <WalletIcon />
          </span>
        </Button>
      )}
      {connected && (
        <button
          className="px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full flex flex-row items-center justify-center bg-white border border-primary text-primary rounded-4xl hover:bg-primary hover:text-white "
          onClick={disconnectWallet}
        >
          <div className="hidden md:flex md:justify-center md:gap-5">
            <span>Disconnect</span> <img className="w-6 h-6" src="/images/metamaskImg.svg" />
          </div>
          <span className="md:hidden">
            <DisconnectWalletIcon />
          </span>
        </button>
      )}
    </>
  );
};

export default ConnectWalletButtons;

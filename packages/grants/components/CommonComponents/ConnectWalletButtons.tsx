import React from "react";
import DisconnectWalletIcon from "../Svgs/DisconnectWalletIcon";
import WalletIcon from "../Svgs/WalletIcon";
import Button from "./Button";

interface Props {
  connected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
}
const ConnectWalletButtons: React.FC<Props> = ({ connected, connectWallet, disconnectWallet }) => {
  return (
    <>
      {!connected && (
        <Button variant="tertiary" className="md:w-44 py-3 px-8 md:px-0" onClick={connectWallet}>
          <span className="hidden md:inline">Connect Wallet</span>
          <span className="md:hidden">
            <WalletIcon />
          </span>
        </Button>
      )}
      {connected && (
        <button
          className="md:w-44 py-3 px-8 md:px-0 bg-blue-50 border-blue-700 text-blue-700 rounded-button font-semibold border shadow-md transition-all ease-in-out hover:text-white hover:bg-blue-500 active:bg-blue-500 active:text-white"
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

import React from "react";
import DisconnectWalletIcon from "../Svgs/DisconnectWalletIcon";
import WalletIcon from "../Svgs/WalletIcon";

interface Props {
  connected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
}
const ConnectWalletButtons: React.FC<Props> = ({ connected, connectWallet, disconnectWallet }) => {
  return (
    <>
      {!connected && (
        <button
          className="bg-warmGray border-ctaYellow text-black hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary rounded-4xl px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full disabled:bg-customLightGray disabled:border-customLightGray disabled:text-secondaryLight disabled:hover:border-customLightGray disabled:hover:bg-customLightGray disabled:hover:text-secondaryLight"
          onClick={connectWallet}
        >
          <span className="hidden md:inline">Connect Wallet</span>
          <span className="md:hidden">
            <WalletIcon />
          </span>
        </button>
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

import Button from "components/CommonComponents/Button";
import Image from "next/image";
import React from "react";
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
        <Button variant="primary" onClick={connectWallet}>
          <span className="hidden md:inline">Connect to Polygon</span>
          <span className="md:hidden">
            <WalletIcon />
          </span>
        </Button>
      )}
      {connected && (
        <button
          className="px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full flex flex-row items-center justify-center bg-white border border-primary text-primary rounded-4xl"
          onClick={disconnectWallet}
        >
          <div className="w-4 h-4 relative">
            <Image src="/images/polygonLogo.png" alt="polygon logo" layout="fill" objectFit="contain" priority={true} />
          </div>
          <span className="mx-2">Polygon</span>
          <span className="block h-2 w-2 rounded-full border border-green-400 bg-green-400"></span>
        </button>
      )}
    </>
  );
};

export default ConnectWalletButtons;

import { ChainId } from "@popcorn/utils";
import { useAccountModal, useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { ConnectWallet } from "components/ConnectWallet";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";
import TertiaryActionButton from "components/TertiaryActionButton";
import { BigNumber, constants } from "ethers";
import usePopLocker from "hooks/staking/usePopLocker";
import useERC20 from "hooks/tokens/useERC20";
import { useDeployment } from "hooks/useDeployment";
import useWeb3 from "hooks/useWeb3";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useProvider } from "wagmi";

export default function Index() {
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { openAccountModal } = useAccountModal();
  const { address: account } = useAccount();
  const provider = useProvider();
  const { address, connector } = useAccount()
  console.log(connector)
  return <div>
    <p>Account: {account}</p>
    {/* <p>Bal: {pop.balance.toString()}</p> */}
    {openConnectModal && (
      <button onClick={openConnectModal} type="button">
        Open Connect Modal
      </button>
    )}

    {openAccountModal && (
      <button onClick={openAccountModal} type="button">
        Open Account Modal
      </button>
    )}

    {openChainModal && (
      <button onClick={openChainModal} type="button">
        Open Chain Modal
      </button>
    )}
    <TertiaryActionButton label="Disconnect" handleClick={disconnect} />
  </div>
}
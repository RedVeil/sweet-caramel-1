import useEagerConnect from "hooks/useEagerConnect";
import useWeb3 from "hooks/useWeb3";
import React, { useCallback, useEffect, useState } from "react";
import { connectors, networkMap } from "../../context/Web3/connectors";
import { getChainLogo } from "./../../context/Web3/networkSwitch";
import DesktopMenu from "./DesktopMenu";
import { MobileMenu } from "./MobileMenu";

const disconnectInjected = (deactivate: Function, activate: any, chainId: number) => {
  localStorage.setItem("eager_connect", "false");
  localStorage.setItem("chainId", String(chainId));
  deactivate(connectors.Injected);
};

export default function Navbar(): JSX.Element {
  if (typeof window === "undefined") {
    return <></>;
  }
  const { chainId, library } = useWeb3();
  const [currentChain, setCurrentChain] = useState({ name: networkMap[chainId], logo: getChainLogo(chainId), chainId });

  useEagerConnect();

  const getChain = useCallback(
    (_chainId) => {
      if (_chainId == "0xa4b1") {
        _chainId = 42161;
      }
      return { name: networkMap[_chainId], logo: getChainLogo(_chainId), chainId: _chainId };
    },
    [chainId, library],
  );

  useEffect(() => {
    if (typeof chainId == "number") {
      setCurrentChain(getChain(chainId));
    }
  }, [chainId]);

  return (
    <>
      <nav className="hidden md:flex pt-9 bg-white z-10">
        <DesktopMenu currentChain={currentChain} disconnectInjected={disconnectInjected} />
      </nav>
      <nav className="md:hidden w-screen h-full relative">
        <MobileMenu currentChain={currentChain} disconnectInjected={disconnectInjected} />
      </nav>
    </>
  );
}

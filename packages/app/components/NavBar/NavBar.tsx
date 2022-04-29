import useWeb3 from "hooks/useWeb3";
import React, { useEffect, useState } from "react";
import { connectors, logos, networkMap } from "../../context/Web3/connectors";
import DesktopMenu from "./DesktopMenu";
import { MobileMenu } from "./MobileMenu";

const disconnectInjected = (deactivate: Function, activate: any, chainId: number) => {
  localStorage.setItem("eager_connect", "false");
  localStorage.setItem("chainId", String(chainId));
  deactivate(connectors.Injected);
};

function getChain(_chainId: number): { name: string; logo: string; chainId: number } {
  return { name: networkMap[_chainId], logo: logos[_chainId], chainId: _chainId };
}

export default function Navbar(): JSX.Element {
  if (typeof window === "undefined") {
    return <></>;
  }
  const { chainId } = useWeb3();
  const [currentChain, setCurrentChain] = useState({ name: networkMap[chainId], logo: logos[chainId], chainId });
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

import { ChevronLeftIcon } from "@heroicons/react/outline";
import { ChainId } from "@popcorn/utils";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useRouter } from "next/router";
import React from "react";
import NavbarLink from "@popcorn/app/components/NavBar/NavbarLinks";

const MobileProductsMenu = ({ onCloseMenu }) => {
  const { connectedChainId } = useWeb3();
  const router = useRouter();
  const networkName = ChainId[connectedChainId] || ChainId[ChainId.Ethereum];
  return (
    <div className="h-screen px-6 py-12">
      <div className="relative flex items-center justify-center" style={{ height: "30%" }}>
        <ChevronLeftIcon
          className="text-black h-10 w-10 absolute -left-3 transform -translate-y-1/2 top-1/2"
          onClick={onCloseMenu}
        />
        <p className="text-black text-center font-medium">Products</p>
      </div>
      <ul className="flex flex-col gap-10 justify-center" style={{ height: "70%" }}>
        {process.env.SHOW_SWEETVAULTS && (
          <li className="mt-1" onClick={onCloseMenu}>
            <NavbarLink
              label="Sweet Vaults"
              url={`/${networkName}/sweet-vaults`}
              isActive={router.pathname === `/[network]/sweet-vaults`}
            />
          </li>
        )}
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink label="3X " url={`/${networkName}/set/3x`} isActive={router.pathname === `/[network]/set/3x`} />
        </li>
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink
            label="Butter"
            url={`/${networkName}/set/butter`}
            isActive={router.pathname === `/[network]/set/butter`}
          />
        </li>
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink
            label="Staking"
            url={`/${networkName}/staking`}
            isActive={router.pathname === `/[network]/staking`}
          />
        </li>
      </ul>
    </div>
  );
};

export default MobileProductsMenu;

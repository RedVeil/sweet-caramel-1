import { ChevronLeftIcon } from "@heroicons/react/outline";
import { useRouter } from "next/router";
import React from "react";
import NavbarLink from "./NavbarLinks";

const MobileProductsMenu = ({ onCloseMenu }) => {
  const router = useRouter();
  return (
    <div className="h-screen px-6 py-12">
      <div className="relative">
        <ChevronLeftIcon
          className="text-black h-10 w-10 absolute -left-3 transform -translate-y-1/2 top-1/2"
          onClick={onCloseMenu}
        />
        <p className="text-black text-center font-medium">Products</p>
      </div>
      <ul className="h-11/12 flex flex-col gap-10 justify-center">
        {process.env.SHOW_SWEETVAULTS && (
          <li className="mt-1" onClick={onCloseMenu}>
            <NavbarLink
              label="Sweet Vaults"
              url="/sweet-vaults"
              isActive={router.pathname === `/[network]/sweet-vaults`}
            />
          </li>
        )}
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink label="3X " url="/set/3x" isActive={router.pathname === `/[network]/set/3x`} />
        </li>
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink label="Butter" url="/set/butter" isActive={router.pathname === `/[network]/set/butter`} />
        </li>
        <li className="mt-1" onClick={onCloseMenu}>
          <NavbarLink label="Staking" url="/staking" isActive={router.pathname === `/[network]/staking`} />
        </li>
      </ul>
    </div>
  );
};

export default MobileProductsMenu;

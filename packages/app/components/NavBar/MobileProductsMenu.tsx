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
      <ul className="h-full flex flex-col gap-10 justify-center">
        <li className="mt-1">
          <NavbarLink
            label="Sweet Vaults"
            url="/sweet-vaults"
            isActive={router.pathname === `/[network]/sweet-vaults`}
          />
        </li>
        <li className="mt-1">
          <NavbarLink label="3X " url="/threeX" isActive={router.pathname === `/[network]/threeX`} />
        </li>
        <li className="mt-1">
          <NavbarLink label="Butter" url="/butter" isActive={router.pathname === `/[network]/butter`} />
        </li>
        <li className="mt-1">
          <NavbarLink label="Staking" url="/staking" isActive={router.pathname === `/[network]/staking`} />
        </li>
      </ul>
    </div>
  );
};

export default MobileProductsMenu;

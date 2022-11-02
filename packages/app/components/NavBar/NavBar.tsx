import React from "react";
import DesktopMenu from "@popcorn/app/components/NavBar/DesktopMenu";
import { MobileMenu } from "@popcorn/app/components/NavBar/MobileMenu";

export default function Navbar(): JSX.Element {
  if (typeof window === "undefined") {
    return <></>;
  }

  return (
    <>
      <nav className="hidden md:flex bg-white z-10 font-landing">
        <DesktopMenu />
      </nav>
      <nav className="md:hidden w-screen h-full relative">
        <MobileMenu />
      </nav>
    </>
  );
}

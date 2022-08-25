import Navbar from "components/NavBar/NavBar";
import useRestakeAlert from "hooks/useRestakeAlert";
import React, { ReactElement } from "react";
import { Toaster } from "react-hot-toast";

export default function Page(props: { children: ReactElement }) {
  useRestakeAlert();
  return (
    <div className="w-full h-full">
      <Navbar />
      <Toaster position="top-right" />
      <div className="md:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-4 md:mx-auto mt-14 pb-6">{props.children}</div>
    </div>
  );
}

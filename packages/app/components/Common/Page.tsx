import Footer from "components/Footer";
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
      <div className=" 2xl:max-w-7xl px-8 mt-14 pb-6">{props.children}</div>
      <Footer />
    </div>
  );
}

import Footer from "components/Footer";
import Navbar from "components/NavBar/NavBar";
import useRestakeAlert from "hooks/useRestakeAlert";
import React, { ReactElement } from "react";
import { Toaster } from "react-hot-toast";

export default function Page(props: { children: ReactElement }) {
  useRestakeAlert();
  return (
    <div className="w-full h-full font-khTeka">
      <Navbar />
      <Toaster position="top-right" />
      <div className=" 2xl:max-w-7xl mt-12 pt-0 px-6 md:p-8">{props.children}</div>
      <Footer />
    </div>
  );
}

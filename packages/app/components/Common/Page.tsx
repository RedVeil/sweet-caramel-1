import Footer from "components/Footer";
import Navbar from "components/NavBar/NavBar";
import useRestakeAlert from "hooks/useRestakeAlert";
import useSubscribeToNewsletter from "hooks/useSubscribeToNewsletter";
import React, { ReactElement } from "react";
import { Toaster } from "react-hot-toast";

export default function Page(props: { children: ReactElement }) {
  useRestakeAlert();
  useSubscribeToNewsletter();

  return (
    <div className="w-full min-h-screen h-full font-khTeka flex flex-col justify-between">
      <div>
        <Navbar />
        <Toaster position="top-right" />
        <div className="pt-5 md:pt-10 px-6 md:px-8">{props.children}</div>
      </div>
      <Footer />
    </div>
  );
}

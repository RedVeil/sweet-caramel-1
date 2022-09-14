import Footer from "components/Layout/Footer/Footer";
import Navigation from "components/Layout/Navigation";
import { FC, PropsWithChildren } from "react";

export const Layout: FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <div className="font-khTeka mx-auto w-full px-6 lg:px-8">
      <header className="h-[112px] flex items-center w-full">
        <Navigation />
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
};
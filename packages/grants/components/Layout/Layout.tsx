import Footer from "components/Layout/Footer/Footer";
import Navigation from "components/Layout/Navigation";
import { FC, PropsWithChildren } from "react";

export const Layout: FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <div className="font-khTeka mx-auto w-full">
      <header className="h-[112px] px-6 lg:px-8">
        <Navigation />
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
};

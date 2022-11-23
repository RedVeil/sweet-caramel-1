import DesktopMenu from "./DesktopMenu";
import { MobileMenu } from "./MobileMenu";

const Navigation = () => {
  return (
    <>
      <div className="hidden lg:block w-full h-full">
        <DesktopMenu />
      </div>
      <div className="block lg:hidden w-full h-full">
        <MobileMenu />
      </div>
    </>
  );
};

export default Navigation;

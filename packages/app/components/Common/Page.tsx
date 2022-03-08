import MobileExcuseAlert from "components/MobileExcuseAlert";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { useContext } from "react";

export default function Page(props) {
  const { mobile: mobileEnabled } = useContext(FeatureToggleContext).features;
  return mobileEnabled ? (
    <>{props.children}</>
  ) : (
    <>
      <div className="hidden lg:block">{props.children}</div>
      <MobileExcuseAlert />
    </>
  );
}

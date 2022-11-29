import { useMemo } from "react";
import { Oval } from "react-loader-spinner";
import { Pop } from "../../types";

export const withLoading = (Component: Pop.FC<any>) => ({ ...props }) => {
  const devMode = useMemo(() => process.env.NODE_ENV === "development", []);
  return (
    <>
      {props.status === "loading" && <span style={{ display: 'inline-block' }}><Oval height="13px" width="13px" visible={true} /></span>}
      {props.status === "error" && <>{devMode && "Error" || ""}</>}
      {props.status === "success" && <Component {...props} />}
      {props.status === "idle" && <>{devMode && "Idle" || ""}</>}
    </>
  );
};

export default withLoading;
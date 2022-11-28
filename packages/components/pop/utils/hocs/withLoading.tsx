import { Oval } from "react-loader-spinner";
import { Pop } from "../../types";

export const withLoading = (Component: Pop.FC<any>) => (props) => {
  return (
    <>
      {props.status === "loading" && <Oval height="13px" width="13px" visible={true} />}
      {props.status === "error" && <div>Error</div>}
      {props.status === "success" && <Component {...props} />}
      {props.status === "idle" && <div>Idle</div>}
    </>
  );
};

export default withLoading;
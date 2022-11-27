import { Pop } from "../../types";
import useLog from "../hooks/useLog";

export const withLogging = (Component: Pop.FC<any>) => (props) => {
  useLog({ Component: Component.displayName || Component.name, props }, [props]);
  return <Component {...props} />;
};
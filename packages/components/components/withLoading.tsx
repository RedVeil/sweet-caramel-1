import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";


const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      return;
    };
  }, []);

  return isMounted;
};


export const withLoading =
  (Component) =>
    ({ loading, ...props }) => {
      return (
        <>
          {loading && <LoadingSpinner height="20px" width="20px" />}
          <div className={loading ? "hidden" : ""}>
            <Component {...props} />
          </div>
        </>
      );
    };

export default withLoading;

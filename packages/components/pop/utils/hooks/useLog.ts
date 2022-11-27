import { useEffect, useMemo } from "react";

function useLog(msg, deps?) {
  const enabled = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);
  useEffect(
    () => {
      !!enabled && console.log(msg);
    },
    deps ? deps : [msg],
  );
}

export default useLog;

import { useEffect, useMemo } from "react";

function useLog(msg, ...deps) {
  // @ts-expect-error
  const callerFunctionName = new Error()?.stack.split("\n")[2].trim().split(" ")[1];
  msg = { ...msg, __useLogCaller: callerFunctionName };

  const enabled = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);
  useEffect(
    () => {
      !!enabled && console.log({ ...msg });
    },
    deps ? deps : [...msg],
  );
}

export default useLog;

import { useEffect } from "react";

function useLog(msg, deps?) {
  useEffect(
    () => {
      process.env.NODE_ENV === "development" && console.log(msg);
    },
    deps ? deps : [msg],
  );
}

export default useLog;

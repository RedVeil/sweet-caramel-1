import { useEffect } from "react";

function useLog(msg, deps?) {
  useEffect(
    () => {
      console.log(msg);
    },
    deps ? deps : [msg],
  );
}

export default useLog;

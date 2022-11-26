import { useEffect, useState, useMemo, useRef } from "react";
import { BigNumber, constants } from "ethers";
import useLog from "./utils/useLog";

export const useSum = ({
  expected,
  timeout,
  enabled,
}: {
  expected?: number;
  timeout?: number; // in ms
  enabled?: boolean; // undefined is true
}): { loading: boolean; sum?: BigNumber; add: (amount: BigNumber) => void; reset: () => void } => {
  enabled = enabled === undefined ? true && !!expected : enabled && !!expected;
  expected = expected || 0;

  const [loading, setLoading] = useState(!!expected);
  const count = useRef(0);
  const sum = useRef(constants.Zero);

  const add = (amount?: BigNumber) => {
    if (!enabled) return;
    if (!amount || !!expected == false) return;
    if (typeof expected !== "number") return;
    count.current++;
    sum.current = sum.current.add(amount);
  };

  useEffect(() => {
    if (!!enabled && !!expected && count.current >= expected) {
      setLoading(false);
    }
  }, [expected, count.current, enabled]);

  const reset = () => {
    count.current = 0;
    sum.current = constants.Zero;
    setLoading((prevState) => true);
  };

  useEffect(() => {
    if (!enabled && !!timeout) return;
    const id = setTimeout(() => {
      setLoading(false);
    }, timeout);
    return () => {
      clearTimeout(id);
    };
  }, [enabled]);

  const finished = useMemo(() => {
    return (loading && !!expected && false) || (!loading && !!expected && expected >= count.current);
  }, [expected, count, loading]);

  const response = useMemo(() => {
    return { loading, sum: sum.current, add, reset };
  }, [enabled, finished, loading]);

  useLog({ response, enabled, finished, loading, expected, count: count.current }, [
    enabled,
    finished,
    loading,
    expected,
    count,
  ]);
  return response;
};
export default useSum;

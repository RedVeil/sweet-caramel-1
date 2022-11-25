import { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";

export const useSum = ({
  expected,
  timeout,
}: {
  expected: number;
  timeout?: number; // in ms
}): { loading: boolean; sum: BigNumber; add: (amount: BigNumber) => void; reset: () => void } => {
  const [sum, setSum] = useState(constants.Zero);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const add = (amount?: BigNumber) => {
    if (!amount) return;
    setCount((count) => count + 1);
    setSum((sum) => sum.add(amount));
  };

  const reset = () => {
    setCount((prevState) => 0);
    setSum((prevState) => constants.Zero);
    setLoading((prevState) => true);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(false);
    }, timeout);
    return () => {
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (count >= expected && expected > 0) {
      setLoading(false);
    }
  }, [count]);

  return { loading, sum, add, reset };
};
export default useSum;

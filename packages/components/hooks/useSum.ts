import { useEffect, useState } from "react";
import { constants } from "ethers";

export const useSum = ({ count }: { count: number }) => {
  const [sum, setSum] = useState(constants.Zero);
  const [loading, setLoading] = useState(true);
  const [expected] = useState(count);
  const [_count, setCount] = useState(0);

  const add = (amount) => {
    setCount((count) => count + 1);
    setSum((sum) => sum.add(amount));
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(false);
    }, 8000);
    return () => {
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (count >= expected) {
      setLoading(false);
    }
  }, [count]);

  return { loading, add, sum };
};
export default useSum;

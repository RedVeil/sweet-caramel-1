import { useEffect, useState } from "react";

export const Test = () => {
  const [accounts, setAccounts] = useState<string[]>([]);
  useEffect(() => {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then((accounts) => {
      setAccounts(accounts);
      console.log(accounts);
    });
  }, []);
  return <div>{accounts?.join(',')}</div>
}
export default Test;
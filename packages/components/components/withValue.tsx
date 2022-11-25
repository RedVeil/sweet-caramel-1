import React from "react";
import { useBalanceValue } from "../hooks/portfolio/useBalanceValue";


export function withValue(Component) {
  const WithValue = ({ chainId, balance, address, account, price, ...props }) => {
    const value = useBalanceValue({ chainId, address, balance, price, account });
    return (
      <Component value={value} {...props} />
    );
  };
  WithValue.displayName = `WithValue(${Component.displayName || Component.name})`;
  return WithValue;
}

export default withValue;

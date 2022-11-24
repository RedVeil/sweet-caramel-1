import { useEffect, useState } from "react";

export const useComponentState = ({ ready, loading }) => {
  const [componentState, setState] = useState({ ready: false, loading: false });
  useEffect(() => {
    setState({ ...componentState, ready, loading });
  }, [ready, loading]);
  return { ready: componentState.ready, loading: componentState.loading };
};

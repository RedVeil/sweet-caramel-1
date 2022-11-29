import { useMemo } from "react";
import { Pop } from "../../types";
import { resolveMultiStatus } from "./../misc";

export const useMultiStatus = ([...statuses]: Pop.UseQueryResult<any>["status"][]) => {
  return useMemo(() => resolveMultiStatus([...statuses]), [...statuses]);
};

import React from "react";
import { Oval } from 'react-loader-spinner'
import useLog from '../hooks/utils/useLog';


export function withLoading(Component) {
  const WithLoading = ({ ...props }) => {
    useLog({ isLoading: props.isLoading, withLoading: true }, [props.isLoading]);
    return (
      <>
        <div className={`${props?.isLoading ? '' : 'hidden'}`}>
          <Oval height="13px" width="13px" visible={true} />
        </div>
        <div className={props?.isLoading ? "hidden" : ""}>
          <Component {...props} />
        </div>
      </>
    );
  };
  WithLoading.displayName = `WithLoading(${Component.displayName || Component.name})`;
  return WithLoading;
}

export default withLoading;

import React from "react";
import LoadingSpinner from "./LoadingSpinner";


export function withLoading(Component) {
  const WithLoading = ({ loading, ...props }) => {
    return (
      <>
        {loading && <LoadingSpinner height="20px" width="20px" />}
        <div className={loading ? "hidden" : ""}>
          <Component {...props} />
        </div>
      </>
    );
  };
  WithLoading.displayName = `WithLoading(${Component.displayName || Component.name})`;
  return WithLoading;
}

export default withLoading;

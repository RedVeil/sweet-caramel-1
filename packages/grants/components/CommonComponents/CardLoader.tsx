import React from "react";
import ContentLoader from "react-content-loader";
export const CardLoader = () => {
  return (
    <ContentLoader viewBox="0 0 450 600">
      <rect x="0" y="0" rx="15" ry="15" width="450" height="400" />
      <rect x="0" y="115" rx="15" ry="15" width="450" height="400" />
      <rect x="0" y="230" rx="15" ry="15" width="450" height="400" />
    </ContentLoader>
  );
};

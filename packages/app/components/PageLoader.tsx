import { FC } from "react";
import LoadingSpinner from "./LoadingSpinner";

const PageLoader: FC = () => {
  return (
    <div className="mx-auto w-full h-full flex flex-row justify-center text-center items-center">
      <div>
        <LoadingSpinner />
      </div>
    </div>
  );
};
export default PageLoader;

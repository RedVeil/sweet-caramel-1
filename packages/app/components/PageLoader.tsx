import { FC } from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoader: FC = () => {
  return (
    <div className="mx-auto w-full h-full flex flex-row justify-center text-center items-center">
      <div>
        <LoadingSpinner size="w-30 h-30" />
      </div>
    </div>
  );
};
export default PageLoader;

import { FC } from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoader: FC = () => {
  return (
    <div className="mx-auto w-full h-full flex flex-row justify-center text-center items-center">
      <div>
        <LoadingSpinner size="w-48 h-48" />
        <p className="font-bold text-2xl mt-8">Loading...</p>
      </div>
    </div>
  );
};
export default PageLoader;

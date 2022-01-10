import { LinearProgress } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { store } from 'context/store';
import { Dispatch, useContext, useEffect } from 'react';
import PageLoader from './PageLoader';

const ColorLinearProgress = withStyles({
  colorPrimary: {
    backgroundColor: '#5CC1EE',
  },
  barColorPrimary: {
    backgroundColor: 'rgb(225 225 225)',
  },
})(LinearProgress);
interface GlobalLinearProgressAndLoadingProps {
  loading: boolean;
  setLoading: Dispatch<boolean>;
}

export function GlobalLinearProgressAndLoading({
  loading,
  setLoading,
}: GlobalLinearProgressAndLoadingProps): JSX.Element {
  const {
    state: { globalLoaderVisible },
  } = useContext(store);

  useEffect(() => {
    if (globalLoaderVisible) {
      console.log('globalLoaderVisible');
      return setLoading(true);
    }
    setLoading(false);

    return () => {
      setLoading(false);
    };
  }, [globalLoaderVisible]);

  return (
    (loading && (
      <div className={'fixed top-0 left-0 right-0 z-50'}>
        <ColorLinearProgress />
        <PageLoader loading={loading} />
      </div>
    )) || <></>
  );
}

import { LinearProgress } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { store } from 'context/store';
import { useContext, useEffect } from 'react';

const ColorLinearProgress = withStyles({
  colorPrimary: {
    backgroundColor: '#5CC1EE',
  },
  barColorPrimary: {
    backgroundColor: 'rgb(225 225 225)',
  },
})(LinearProgress);

export function GlobalLinearProgress({ state }) {
  const [loading, setLoading] = state;

  const {
    state: { globalLoaderVisible },
  } = useContext(store);

  useEffect(() => {
    if (globalLoaderVisible) {
      return setLoading(true);
    }
    setLoading(false);

    return () => {
      setLoading(false);
    };
  }, [globalLoaderVisible]);

  return (
    (loading && (
      <div className={'fixed top-0 left-0 right-0'}>
        {' '}
        <ColorLinearProgress />
      </div>
    )) || <></>
  );
}

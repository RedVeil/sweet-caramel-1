import { LinearProgress } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { store } from 'context/store';
import { useContext } from 'react';

const ColorLinearProgress = withStyles({
  colorPrimary: {
    backgroundColor: '#eeeeee',
  },
  barColorPrimary: {
    backgroundColor: 'rgb(225 225 225)',
  },
})(LinearProgress);

export function GlobalLinearProgress({ state }) {
  const {
    state: { globalLoaderVisible },
  } = useContext(store);

  return (
    (globalLoaderVisible && (
      <div className={'fixed top-0 left-0 right-0'}>
        {' '}
        <ColorLinearProgress />
      </div>
    )) || <></>
  );
}

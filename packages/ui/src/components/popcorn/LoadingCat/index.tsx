import React from 'react';
import styled, { keyframes } from 'styled-components';
import { ReactComponent as LoadingCat } from './loadingcat.svg';

const rotate = keyframes`
  from { transform: rotateZ(0deg) }
  to { transform: rotateZ(-360deg) }
`;

const StyledLoading = styled(LoadingCat)`
  position: relative;
  background: none;
  body {
    text-align: center;
  }
  #svg-id-loadingcat {
    animation: ${rotate} 4s infinite linear;
    transform-origin: center;
    transform-box: fill-box;
  }
  #svg-id-loadingpopcorn {
    animation: ${rotate} 2s infinite linear;
    transform-origin: center;
    transform-box: fill-box;
  }
`;

export const LoadingCatComponent: React.FC = () => <StyledLoading />;

export default LoadingCatComponent;

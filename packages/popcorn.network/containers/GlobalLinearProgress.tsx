import { LinearProgress } from "@material-ui/core";
import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
`;

export const GlobalLinearProgress = ({visible}) => {
  if (visible) {
    return <LinearProgress />
  } else {
    return <></>;
  }
}

export default GlobalLinearProgress;
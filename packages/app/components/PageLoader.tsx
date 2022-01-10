import styled from 'styled-components';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  loading: boolean;
}

const DisappearingDiv = styled.div<PageLoaderProps>`
  background: #fff;
  width: 100vw;
  height: 100vh;
  display: flex;
  opacity: ${(props) => (props.loading ? 1 : 0)};
  transition: opacity 0.3s linear, z-index 0.3s ease-in-out;
  flex-direction: column;
  position: absolute;
  margin-bottom: 100px;
  overflow: none;
  justify-content: center;
  align-items: center;
  z-index: ${(props) => (props.loading ? 49 : -10)};
`;

const PageLoader: React.FC<PageLoaderProps> = ({ loading }) => {
  return (
    <DisappearingDiv loading={loading}>
      <div className="mx-auto">
        <LoadingSpinner size="w-48 h-48" />
      </div>
      <div className="mx-auto">
        <p className="font-bold text-2xl mt-8">Loading...</p>
      </div>
    </DisappearingDiv>
  );
};
export default PageLoader;

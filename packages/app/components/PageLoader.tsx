import LoadingCat from '@popcorn/ui/components/popcorn/LoadingCat';
import styled from 'styled-components';

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
      <div
        className="relative flex flex-col"
        style={{ height: 450, width: 400 }}
      >
        <LoadingCat />
      </div>
      <div>
        <p className="font-bold text-2xl">Loading...</p>
      </div>
    </DisappearingDiv>
  );
};
export default PageLoader;

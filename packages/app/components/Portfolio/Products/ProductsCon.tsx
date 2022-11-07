import PortfolioCardCon from "../PortfolioCardCon";
import StakingProduct from "./StakingProduct";
import ThreeXProduct from "./ThreeXProduct";

const ProductsCon = () => {
  return (
    <PortfolioCardCon cardTitle="Products">
      <StakingProduct />
      <ThreeXProduct />
    </PortfolioCardCon>
  );
};

export default ProductsCon;

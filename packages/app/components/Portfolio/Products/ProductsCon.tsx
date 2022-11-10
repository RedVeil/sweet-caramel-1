import PortfolioCardCon from "../PortfolioCardCon";
import ButterProduct from "./ButterProduct";
import StakingProduct from "./StakingProduct";
import ThreeXProduct from "./ThreeXProduct";

const ProductsCon = () => {
  return (
    <PortfolioCardCon cardTitle="Products">
      <StakingProduct />
      <ThreeXProduct />
      <ButterProduct />
    </PortfolioCardCon>
  );
};

export default ProductsCon;

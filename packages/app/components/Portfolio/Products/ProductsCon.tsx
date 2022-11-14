import PortfolioCardCon from "../PortfolioCardCon";
import ButterProduct from "./ButterProduct";
import StakingProduct from "./StakingProduct";
import SweetVaultsProduct from "./SweetVaultsProduct";
import ThreeXProduct from "./ThreeXProduct";

const ProductsCon = () => {
  return (
    <PortfolioCardCon cardTitle="Products">
      <StakingProduct />
      <SweetVaultsProduct />
      <ThreeXProduct />
      <ButterProduct />
    </PortfolioCardCon>
  );
};

export default ProductsCon;

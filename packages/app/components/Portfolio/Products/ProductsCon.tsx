import PortfolioCardCon from "../PortfolioCardCon";
import ButterProduct from "./ButterProduct";
import StakingProduct from "./StakingProduct";
import ThreeXProduct from "./ThreeXProduct";

const ProductsCon = () => {
  return (
    <PortfolioCardCon cardTitle="Products">
      <StakingProduct />
      {/* TODO: Add back and test when sweet vaults is released */}
      {/* <SweetVaultsProduct /> */}
      <ThreeXProduct />
      <ButterProduct />
    </PortfolioCardCon>
  );
};

export default ProductsCon;

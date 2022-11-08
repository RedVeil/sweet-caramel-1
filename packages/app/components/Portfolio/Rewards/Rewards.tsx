import PortfolioCardCon from "../PortfolioCardCon";
import Vesting from "./Vesting/Vesting";

const Rewards = () => {
  return (
    <PortfolioCardCon cardTitle="Rewards">
      <Vesting />
    </PortfolioCardCon>
  );
};

export default Rewards;

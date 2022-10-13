import { ChainId } from '@popcorn/utils';
import { createContext, useState, useContext, useRef, Dispatch, SetStateAction } from 'react';


interface IPortfolioContext {
  selectedNetwork: ChainId | null;
  setSelectedNetwork: Dispatch<SetStateAction<ChainId | null>>;
}

const initialState: IPortfolioContext = {
  selectedNetwork: null,
  setSelectedNetwork: () => { },
};

export const PortfolioContext = createContext<IPortfolioContext>(initialState);

export const PortfolioContextProvider: React.FC = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<ChainId | null>(null);

  return (
    <PortfolioContext.Provider
      value={{
        selectedNetwork,
        setSelectedNetwork
      }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioContextProvider');
  }
  return context;
};
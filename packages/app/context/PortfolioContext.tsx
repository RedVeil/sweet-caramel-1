import { ChainId } from '@popcorn/utils';
import { createContext, useState, useContext, useRef, Dispatch, SetStateAction } from 'react';


interface IPortfolioContext {
  selectedNetwork: { id: string, value: string };
  setSelectedNetwork: Dispatch<SetStateAction<{ id: string, value: string }>>;
}

const initialState: IPortfolioContext = {
  selectedNetwork: null,
  setSelectedNetwork: () => { },
};

export const PortfolioContext = createContext<IPortfolioContext>(initialState);

export const PortfolioContextProvider: React.FC = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<{ id: string, value: string }>({
    id: "All",
    value: "All",
  });

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
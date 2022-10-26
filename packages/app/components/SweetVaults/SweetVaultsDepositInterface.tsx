import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { networkMap } from "@popcorn/hardhat/lib/utils/constants";
import { Vault } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils";
import { SweetVaultWithMetadata, Token } from "@popcorn/utils/types";
import SelectToken from "components/BatchButter/SelectToken";
import SlippageSettings from "components/BatchButter/SlippageSettings";
import FakeInputField from "components/FakeInputField";
import { BigNumber, constants } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { approve, depositAndStake, unstakeAndRedeem } from "helper/VaultActions";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useTokenAllowance from "hooks/tokens/useTokenAllowance";
import { useChainIdFromUrl } from "hooks/useChainIdFromUrl";
import useWeb3 from "hooks/useWeb3";
import Image from "next/image";
import { useEffect, useState } from "react";
import TokenInput from "../Common/TokenInput";
import TokenInputToggle from "../TokenInputToggle";
import SweetVaultButton from "./SweetVaultButton";

export enum InteractionType {
  Deposit,
  Withdraw,
}

export interface SweetVaultsDepositInterfaceProps {
  sweetVault: SweetVaultWithMetadata;
  revalidate: () => void;
  zapper: Zapper;
  poolToken: Token[];
  defaultTokenList: Token[];
}

async function getAssetPerShare(chainId: number, assetAddress: string, shareAddress: string) {
  const chainString = (chainId = 1337 ? "ethereum" : networkMap[chainId].toLowerCase());
  const url = `https://coins.llama.fi/prices/current/${chainString}:${assetAddress},${chainString}:${shareAddress}`;
  const result = await fetch(url);
  const parsed = await result.json();
  const assetPrice = parsed.coins[`${chainString}:${assetAddress}`]?.price;
  const sharePrice = parsed.coins[`${chainString}:${shareAddress}`]?.price;
  if (assetPrice && sharePrice) {
    // asset per share - if asset is 1$ and share is 2$, we get 2 assets per share so we have to do share price / input price
    return sharePrice / assetPrice;
  }
  return 0;
}

async function calcOutputAmount(
  sweetVault: SweetVaultWithMetadata,
  zapper: Zapper,
  buyToken: Token,
  poolToken: Token[],
  defaultTokenList: Token[],
  rpcProvider,
  chainId: number,
): Promise<number> {
  if (!!defaultTokenList?.find((token) => token.address === buyToken?.address)) {
    const poolAddress = await zapper.getPoolAddress(sweetVault?.metadata.underlyingToken?.address, rpcProvider);
    const sellToken = await zapper.getIntermediateToken(
      poolAddress,
      poolToken.map((token) => token.contract),
      true,
    );
    const query = zapper.constructSwapUrl(buyToken, sellToken?.token, parseUnits("1", sellToken?.token?.decimals), 0);
    const data = await (await fetch(query)).json();
    return Number(data.price);
  }
  const assetPerShare = await getAssetPerShare(
    chainId,
    sweetVault.metadata.underlyingToken.address,
    sweetVault.contract.address,
  );
  return assetPerShare;
}

const SweetVaultsDepositInterface: React.FC<SweetVaultsDepositInterfaceProps> = ({
  sweetVault,
  revalidate,
  zapper,
  poolToken,
  defaultTokenList,
}) => {
  const { account, signer, rpcProvider, onContractSuccess, onContractError } = useWeb3();
  const chainId = useChainIdFromUrl();
  const [interactionType, setInteractionType] = useState<InteractionType>(InteractionType.Deposit);
  const [inputAmount, setInputAmount] = useState<BigNumber>(constants.Zero);
  const [assetsPerShare, setAssetsPerShare] = useState<number>(1);
  const [slippage, setSlippage] = useState<number>(1);
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>(
    defaultTokenList?.find((token) => token.symbol == sweetVault?.metadata?.defaultDepositTokenSymbol)?.address ||
    sweetVault?.metadata?.underlyingToken?.address,
  );
  const [selectedToken, setSelectedToken] = useState<Token>(sweetVault?.metadata?.underlyingToken);
  const {
    data: vaultZapperAllowance,
    error,
    mutate,
  } = useTokenAllowance(sweetVault?.contract.address, chainId, account, zapper?.zapper?.address);
  const approveToken = useApproveERC20(chainId);

  useEffect(() => {
    if (sweetVault?.metadata && poolToken?.length) {
      const list = [sweetVault?.metadata.underlyingToken, ...poolToken, ...defaultTokenList];
      setTokenList(list.filter((token, index) => list.findIndex((obj) => obj.address === token.address) === index));
    }
  }, [sweetVault?.metadata, sweetVault?.metadata?.underlyingToken, poolToken, defaultTokenList]);

  useEffect(() => {
    setSelectedToken(tokenList.find((token) => token?.address === selectedTokenAddress));
  }, [tokenList, selectedTokenAddress]);

  useEffect(() => {
    if (sweetVault && zapper && selectedToken && poolToken && defaultTokenList) {
      calcOutputAmount(sweetVault, zapper, selectedToken, poolToken, defaultTokenList, rpcProvider, chainId).then(
        (res) => setAssetsPerShare(res),
      );
    }
  }, [selectedToken]);

  function selectToken(token: Token): void {
    if (interactionType === InteractionType.Deposit) resetInput();
    setSelectedTokenAddress(token?.address);
  }

  function resetInput(): void {
    setInputAmount(constants.Zero);
  }

  function toggleInteractionType() {
    setInteractionType(
      interactionType === InteractionType.Deposit ? InteractionType.Withdraw : InteractionType.Deposit,
    );
    setSelectedTokenAddress(sweetVault?.metadata?.underlyingToken?.address);
    resetInput();
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`z-0 bg-white rounded-lg w-full md:basis-108 shrink-0 p-6 mr-8 border border-gray-300 flex flex-col justify-between`}
    >
      <div>
        <div className="mb-12">
          <TokenInputToggle
            state={[interactionType !== InteractionType.Deposit, toggleInteractionType]}
            labels={["Deposit", "Withdraw"]}
          />
        </div>
        {interactionType === InteractionType.Deposit ? (
          <TokenInput
            chainId={chainId}
            label={"Deposit"}
            token={selectedToken}
            amount={inputAmount}
            balance={selectedToken?.balance}
            setAmount={setInputAmount}
            tokenList={tokenList}
            //TODO potentially make TokenSelection explicit
            selectToken={selectToken}
          />
        ) : (
          <TokenInput
            chainId={chainId}
            label={"Withdraw"}
            token={{ contract: sweetVault?.contract, ...sweetVault?.metadata }}
            amount={inputAmount}
            balance={sweetVault?.metadata?.deposited}
            setAmount={setInputAmount}
            tokenList={[{ contract: sweetVault?.contract, ...sweetVault?.metadata }]}
          />
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center my-6">
          <div className="w-20 bg-white">
            <div className="flex items-center w-14 h-14 mx-auto border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 hover:border-gray-400">
              <img
                src="/images/icons/exchangeIcon.svg"
                alt="exchangeIcon"
                className="p-3 mx-auto"
                onClick={toggleInteractionType}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        {interactionType === InteractionType.Deposit ? (
          <FakeInputField
            inputValue={assetsPerShare ? Number(formatUnits(inputAmount, selectedToken?.decimals)) / assetsPerShare : 0}
            children={
              <span className="flex flex-row items-center justify-end">
                <Image priority={true} className="w-5 mr-1" src={sweetVault?.metadata?.icon} width="20" height="20" />
                <p className="font-semibold leading-none text-gray-700 group-hover:text-blue-700 ml-2 hidden md:block">
                  {sweetVault?.metadata?.symbol}
                </p>
              </span>
            }
          />
        ) : (
          <FakeInputField
            inputValue={assetsPerShare * Number(formatUnits(inputAmount, sweetVault?.metadata?.decimals))}
            children={
              <SelectToken
                chainId={chainId}
                options={tokenList}
                selectedToken={selectedToken}
                selectToken={selectToken}
                allowSelection
              />
            }
          />
        )}
        {!!defaultTokenList?.find((token) => token?.address === selectedTokenAddress) && (
          <div className="w-full mt-2">
            <SlippageSettings slippage={slippage} setSlippage={setSlippage} slippageOptions={[1, 2, 3]} />
          </div>
        )}
        <div className="w-full text-center mt-6 lglaptop:mt-8 xl:mt-10 2xl:mt-12">
          {interactionType === InteractionType.Deposit ? (
            <SweetVaultButton
              mainActionLabel="Deposit"
              mainAction={() =>
                depositAndStake(
                  inputAmount,
                  slippage,
                  sweetVault,
                  zapper,
                  selectedToken,
                  revalidate,
                  resetInput,
                  onContractSuccess,
                  onContractError,
                  signer,
                  rpcProvider,
                )
              }
              approve={() =>
                approve(
                  selectedToken === sweetVault?.metadata?.underlyingToken
                    ? (sweetVault?.contract as Vault)
                    : zapper?.zapper,
                  selectedToken,
                  revalidate,
                  signer,
                  approveToken,
                )
              }
              inputAmount={inputAmount}
              allowance={selectedToken?.allowance}
              selectedToken={selectedToken}
              disabled={inputAmount?.eq(constants.Zero) || inputAmount?.gt(selectedToken?.balance) || !assetsPerShare}
            />
          ) : (
            <SweetVaultButton
              mainActionLabel="Withdraw"
              mainAction={() =>
                unstakeAndRedeem(
                  inputAmount,
                  slippage,
                  sweetVault,
                  zapper,
                  selectedToken,
                  revalidate,
                  resetInput,
                  onContractSuccess,
                  onContractError,
                  signer,
                  rpcProvider,
                )
              }
              approve={() =>
                approve(
                  selectedToken === sweetVault?.metadata?.underlyingToken
                    ? (sweetVault?.contract as Vault)
                    : zapper?.zapper,
                  { contract: sweetVault?.contract, ...sweetVault?.metadata },
                  selectedTokenAddress === sweetVault?.metadata?.address ? revalidate : mutate,
                  signer,
                  approveToken,
                )
              }
              inputAmount={inputAmount}
              allowance={
                selectedToken === sweetVault?.metadata?.underlyingToken
                  ? sweetVault?.metadata?.allowance
                  : vaultZapperAllowance
              }
              selectedToken={{ contract: sweetVault?.contract, ...sweetVault?.metadata }}
              disabled={inputAmount?.eq(constants.Zero) || inputAmount?.gt(selectedToken?.balance) || !assetsPerShare}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default SweetVaultsDepositInterface;

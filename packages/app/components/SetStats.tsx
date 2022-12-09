import { ChainId } from "@popcorn/utils";
import StatusWithLabel from "@popcorn/app/components/Common/StatusWithLabel";
import { Apy } from "@popcorn/components/pop/Staking";
import { Tvl } from "@popcorn/components/pop/Contract";

export interface SetStatsProps {
  address: string;
  chainId: ChainId;
  stakingAddress: string;
  symbol: string;
}

export default function SetStats({ address, chainId, stakingAddress, symbol }: SetStatsProps) {
  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-0 md:space-x-6">
      <StatusWithLabel
        content={<Apy chainId={chainId} address={address} />}
        label={
          <>
            <span className="lowercase">v</span>APR
          </>
        }
        infoIconProps={{
          id: "vAPR",
          title: "How vAPR is calculated",
          content: (
            <>
              `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying
              stablecoins (<Apy address={address} chainId={chainId} />) and is boosted with POP (
              <Apy address={stakingAddress} chainId={chainId} />
              ). You must stake your {symbol} to receive the additional vAPR in POP. 90% of earned POP rewards are
              vested over one year.`
            </>
          ),
        }}
      />
      <div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>

      <StatusWithLabel content={<Tvl chainId={chainId} address={address} />} label="Total Deposits" />
      <div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>

      <>
        <StatusWithLabel content={"$500k"} label="TVL Limit" />
      </>
    </div>
  );
}

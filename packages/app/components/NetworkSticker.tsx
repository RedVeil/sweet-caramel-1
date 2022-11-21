import { FC } from "react";
import Image from "next/image";
import { ChainId, networkLogos } from "@popcorn/utils";
import { useChainIdFromUrl } from "@popcorn/app/hooks/useChainIdFromUrl";

interface NetworkStickerProps {
  selectedChainId?: ChainId;
}

export const NetworkSticker: FC<NetworkStickerProps> = ({ selectedChainId }) => {
  const chainId = useChainIdFromUrl();
  return (
    <div className="absolute top-0 -left-4">
      <Image
        src={networkLogos[selectedChainId ?? chainId]}
        alt={ChainId[selectedChainId ?? chainId]}
        height="24px"
        width="24px"
        objectFit="contain"
      />
    </div>
  );
};

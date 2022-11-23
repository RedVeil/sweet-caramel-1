declare global {
  interface Window {
    ethereum: any;
  }
}
window.ethereum = window.ethereum || {};
declare module "*.svg" {
  import { FC, SVGProps } from "react";
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}

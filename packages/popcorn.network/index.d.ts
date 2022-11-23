declare global {
  interface Window { ethereum: any }
}

declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}

window.ethereum = window.ethereum || {};
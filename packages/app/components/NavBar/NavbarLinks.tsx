import Link from "next/link";
import { useRouter } from "next/router";

interface NavbarLinkProps {
  label: string;
  url?: string;
  isActive: boolean;
  onClick?: Function;
  target?: string;
}

const NavbarLink: React.FC<NavbarLinkProps> = ({ label, url, isActive, onClick, target }) => {
  const className = `
  text-primary leading-5 text-5xl md:text-lg ${isActive ? "text-black font-medium" : ""} 
    hover:text-black cursor-pointer
  `;
  const router = useRouter();

  if (!url) {
    return (
      <a
        className={className}
        target={target || "_self"}
        onClick={(e) => {
          onClick && onClick();
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={`/${router?.query?.network}${url}` || ""} passHref>
      <a
        className={className}
        target={target || "_self"}
        onClick={(e) => {
          onClick && onClick();
        }}
      >
        {label}
      </a>
    </Link>
  );
};
export default NavbarLink;

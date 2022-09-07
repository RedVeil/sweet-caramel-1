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
  text-gray-500 text-xl leading-4 font-medium md:font-semibold font-base 
  md:text-base ${isActive ? "text-gray-800 font-medium" : ""} 
    hover:text-gray-900 cursor-pointer
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

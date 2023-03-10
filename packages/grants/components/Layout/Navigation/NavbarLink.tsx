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
  const className = `leading-[100%] text-5xl md:text-lg flex-shrink-0 ${
    isActive ? "text-black font-medium" : "text-primary"
  } 
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
    <Link
      href={`${url}` || ""}
      passHref
      className={className}
      target={target || "_self"}
      onClick={(e) => {
        onClick && onClick();
      }}
    >
      {label}
    </Link>
  );
};
export default NavbarLink;

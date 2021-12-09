import Link from 'next/link';

interface NavbarLinkProps {
  label: string;
  url?: string;
  isActive: boolean;
  onClick?: Function;
  target?: string;
}

const NavbarLink: React.FC<NavbarLinkProps> = ({
  label,
  url,
  isActive,
  onClick,
  target,
}) => {
  const className = `
    font-base 
    text-base ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'} 
    hover:text-gray-900 cursor-pointer
  `;

  if (!url) {
    return (
      <a
        className={className}
        target={target || '_self'}
        onClick={(e) => {
          onClick && onClick();
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={url || ''} passHref>
      <a
        className={className}
        target={target || '_self'}
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

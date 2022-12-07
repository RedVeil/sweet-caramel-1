export const Link = ({ href, children, target = "_blank", className = '' }) => {
  return (
    <a href={href} target={target} className={'text-customPurple hover:text-customLightPurple leading-5' + ' ' + className}>{children}</a>
  );
};

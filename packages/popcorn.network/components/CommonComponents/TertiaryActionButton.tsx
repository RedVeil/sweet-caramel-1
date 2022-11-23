interface TertiaryActionButtonProps {
  label: string;
  handleClick?: any;
  disabled?: boolean;
  className?: string;
}

const TertiaryActionButton: React.FC<TertiaryActionButtonProps> = ({
  label,
  handleClick,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      className={`${className} whitespace-nowrap px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full flex flex-row items-center justify-center bg-white border text-primary border-primary rounded-4xl`}
      onClick={handleClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
export default TertiaryActionButton;

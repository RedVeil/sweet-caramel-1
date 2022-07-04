interface SecondaryActionButtonProps {
  label: string;
  handleClick: any;
  disabled?: boolean;
}

const SecondaryActionButton: React.FC<SecondaryActionButtonProps> = ({
  label,
  handleClick,
  disabled = false,
  children,
}) => {
  return (
    <button
      type="button"
      className="w-full h-hull py-3 px-8 flex flex-row items-center justify-center rounded-full bg-white border border-blue-600 text-blue-600 font-medium hover:bg-blue-600 hover:text-white disabled:bg-white disabled:text-gray-300 disabled:border-gray-300"
      onClick={handleClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
export default SecondaryActionButton;

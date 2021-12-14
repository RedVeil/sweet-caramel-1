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
      className="w-full h-hull py-3 flex flex-row items-center justify-center bg-blue-400 rounded-full hover:bg-blue-500 disabled:bg-gray-300"
      onClick={handleClick}
      disabled={disabled}
    >
      <p className="text-base text-white font-medium">{label}</p>
    </button>
  );
};
export default SecondaryActionButton;

interface PseudoRadioButtonProps {
  label: string;
  handleClick: Function;
  isActive: boolean;
}

const PseudoRadioButton: React.FC<PseudoRadioButtonProps> = ({
  label,
  handleClick,
  isActive,
}) => {
  return (
    <button
      className={`py-2 w-16 border-2 rounded-2xl text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 ${
        isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
      }`}
      type="button"
      onClick={() => handleClick()}
    >
      {label}
    </button>
  );
};
export default PseudoRadioButton;

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
      className={`py-2 w-20 border-3 rounded-xl text-base font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 ${
        isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'
      }`}
      type="button"
      onClick={() => handleClick()}
    >
      {label}
    </button>
  );
};
export default PseudoRadioButton;

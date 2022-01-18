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
      className={`py-2 w-24 h-12 border-3 rounded-xl text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 ${
        isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'
      }`}
      type="button"
      onClick={() => handleClick()}
    >
      <p
        className={`text-md font-semibold text-sm hover:text-gray-100 ${
          isActive ? 'text-gray-100' : 'border-gray-200'
        }`}
      >
        {label}
      </p>
    </button>
  );
};
export default PseudoRadioButton;

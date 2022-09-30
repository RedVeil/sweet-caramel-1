interface PseudoRadioButtonProps {
  label: string | React.ReactNode;
  handleClick: Function;
  isActive: boolean;
  activeClass?: string;
  extraClasses?: string;
}

const PseudoRadioButton: React.FC<PseudoRadioButtonProps> = ({
  label,
  handleClick,
  isActive,
  activeClass,
  extraClasses,
}) => {
  return (
    <button
      className={`py-2 px-3 h-12 border w-full rounded-lg text-lg leading-8 ${extraClasses} ${
        isActive ? `${activeClass}` : "border-customLightGray"
      }`}
      type="button"
      onClick={() => handleClick()}
    >
      {label}
    </button>
  );
};
export default PseudoRadioButton;

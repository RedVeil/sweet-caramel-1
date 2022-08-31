interface PseudoRadioButtonProps {
  label: string;
  handleClick: Function;
  isActive: boolean;
}

const PseudoRadioButton: React.FC<PseudoRadioButtonProps> = ({ label, handleClick, isActive }) => {
  return (
    <button
      className={`py-2 w-14 xs:w-24 border rounded-lg text-lg leading-8 hover:bg-warmGray hover:text-black hover:border-warmGray ${
        isActive ? "bg-warmGray border-warmGray text-black" : "border-customLightGray"
      }`}
      type="button"
      onClick={() => handleClick()}
    >
      <p>{label}</p>
    </button>
  );
};
export default PseudoRadioButton;

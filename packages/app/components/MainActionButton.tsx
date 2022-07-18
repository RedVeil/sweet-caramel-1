interface MainActionButtonProps {
  label: string;
  handleClick: any;
  disabled?: boolean;
}

const MainActionButton: React.FC<MainActionButtonProps> = ({ label, handleClick, disabled = false, children }) => {
  return (
    <button
      type="button"
      className="w-full h-hull py-3 px-8 flex flex-row items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-300"
      onClick={handleClick}
      disabled={disabled}
    >
      <p className="text-base text-white font-medium">{label}</p>
    </button>
  );
};
export default MainActionButton;

interface MainActionButtonProps {
  label: string;
  handleClick: any;
  disabled?: boolean;
}

export default function MainActionButton({
  label,
  handleClick,
  disabled = false,
}: MainActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="button button-primary w-full"
      onClick={handleClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

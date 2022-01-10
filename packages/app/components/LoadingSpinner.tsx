interface LoadingSpinnerProps {
  size?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'h-8 w-8',
}) => {
  return (
    <div className={`${size}`}>
      <img
        src="/images/popcorn2.svg"
        className="w-full h-full animate-spin-slow"
      />
    </div>
  );
};

export default LoadingSpinner;

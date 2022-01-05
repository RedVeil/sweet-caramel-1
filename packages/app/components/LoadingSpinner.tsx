interface LoadingSpinnerProps {
  size?: string;
  cat?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'h-8 w-8',
  cat = false,
}) => {
  return (
    <div className={`${size}`}>
      <img
        src={cat ? '/images/loadingCat.svg' : '/images/popcorn2.svg'}
        className="w-full h-full animate-spin-slow"
      />
    </div>
  );
};

export default LoadingSpinner;

import toast from "react-hot-toast";
import Lottie from "react-lottie";
import loaderAnim from "../../LottieAnimations/loader.json";

export interface ToastParams {
  title: string;
  description: string;
}

export interface ToastOptions {
  loading: (toastParams: ToastParams) => void;
  success: (toastParams: ToastParams) => void;
  error: (toastParams: ToastParams) => void;
}

const LoadingIcon = () => {
  const loaderOptions = {
    loop: true,
    autoplay: true,
    animationData: loaderAnim,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
    },
  };

  return (
    <div className="mt-7 ml-7">
      <Lottie options={loaderOptions} width="36px" height="36px" />
    </div>
  );
}

const TransactionToast: ToastOptions = {
  loading: ({ title, description }: ToastParams) => {
    toast.dismiss();
    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg pointer-events-auto flex`}
      >
        <LoadingIcon />
        <div className="w-full flex flex-col p-7">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <div className="mt-2">{description}</div>
        </div>
      </div>
    ))
  },
  success: ({ title, description }: ToastParams) => {
    toast.dismiss();
    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg pointer-events-auto flex`}
      >
        <img src="/images/icons/success.svg" className="w-8 h-8 mt-7 ml-7" />
        <div className="w-full flex flex-col p-7">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <div className="mt-2">{description}</div>
        </div>
      </div>
    ))
  },
  error: ({ title, description }: ToastParams) => {
    toast.dismiss();
    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg pointer-events-auto flex`}
      >
        <img src="/images/icons/error.svg" className="w-8 h-8 mt-7 ml-7" />
        <div className="w-full flex flex-col p-7">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <div className="mt-2">{description}</div>
        </div>
      </div>
    ))
  },
};
export default TransactionToast;

import React, { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import PrimaryButton from 'components/CommonComponents/PrimaryButton'
import { toast } from "react-hot-toast";
import { setSingleActionModal } from "app/actions";
import { store } from "app/store";
import { isValidEmailAddress } from "helpers/verifyEmail";


const useSubscribeToNewsletter = (): {
  showNewsletterModal: () => void,
  subscribeToNewsLetter: ({ onSuccess, email }: { onSuccess: () => void, email: string }) => void,
  subscribing: boolean,
  subscriptionSuccessful: boolean,
} => {
  const { dispatch } = useContext(store);
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [subscriptionSuccessful, setSubscriptionSuccessful] = useState<boolean>(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const subscribeToNewsLetter = async ({ onSuccess, email }: { onSuccess: () => void, email: string }) => {
    if (email?.trim()?.length === 0 || isValidEmailAddress(email)) return

    setSubscribing(true);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
        }),
      });
      setSubscribing(false);
      setSubscriptionSuccessful(true);
      setTimeout(() => {
        setSubscriptionSuccessful(false);
      }, 5000);
      onSuccess();
    } catch (error) {
      setSubscribing(false);
      console.log(error);
    }
  };

  const showNewsletterModal = () => {
    dispatch(
      setSingleActionModal({
        image: <Image src="/images/newsletterAvatar.png" alt="newsletter avatar" width={88} height={88} />,
        title: "Sign up for our newsletter",
        children: (
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = emailRef.current.value;
            subscribeToNewsLetter({
              email,
              onSuccess: () => {
                dispatch(setSingleActionModal({ visible: false }))
                toast.success("Subscribed Successfully!")
              }
            })
          }}>
            <input
              type="email"
              name="EMAIL"
              id="mce-EMAIL"
              ref={emailRef}
              placeholder="Enter your email"
              style={{ height: '56px' }}
              className="border border-customLightGray rounded-lg h-14 w-full focus:border-customLightGray px-4 py-4 mb-6 md:mb-8"
            />
            <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
              <input type="text" name="b_5ce5e82d673fd2cfaf12849a5_e85a091ed3" tabIndex={-1} />
            </div>
            <PrimaryButton
              type="submit"
            >
              Submit
            </PrimaryButton>
          </form>
        ),
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
        visible: true
      })
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const subscribedToNewsletter = localStorage.getItem("subscribedToNewsletter");
        if (!subscribedToNewsletter) {
          setTimeout(() => {
            showNewsletterModal();
            localStorage.setItem("subscribedToNewsletter", "true");
          }, 3000)
        }
      } catch (error) {
        console.log(error);
      }
    }
  }, []);

  return {
    showNewsletterModal,
    subscribeToNewsLetter,
    subscribing,
    subscriptionSuccessful
  }
};

export default useSubscribeToNewsletter
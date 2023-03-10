import { verifyEmail } from "@popcorn/utils";
import SecondaryButton from "components/SecondaryActionButton";
import React, { KeyboardEvent, useState } from "react";

const NewsLetterSubscription = ({ title, buttonLabel }: { title: string; buttonLabel: string }) => {
  const [subscribeEmail, setSubscribeEmail] = useState<string>("");
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [subscriptionSuccessful, setSubscriptionSuccessful] = useState<boolean>(false);

  const subscribeToNewsLetter = async () => {
    if (subscribeEmail === "" || verifyEmail(subscribeEmail)) return;
    setSubscribing(true);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: subscribeEmail,
          status: "subscribed",
        }),
      });
      setSubscriptionSuccessful(true);
      setSubscribing(false);
      setTimeout(() => {
        setSubscriptionSuccessful(false);
      }, 5000);
    } catch (error) {
      setSubscribing(false);
      console.log(error);
    }
  };
  const onEnterKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      subscribeToNewsLetter();
    }
  };
  return (
    <div className="validate mt-12">
      <h6 className="px-1 leading-6">{title}</h6>
      <input
        type="email"
        name="EMAIL"
        id="mce-EMAIL"
        className=" border-x-0 border-y-customLightGray text-primaryLight placeholder-primaryLight px-1 py-2 w-full mt-2 leading-7"
        placeholder="Enter your email"
        onChange={(e) => setSubscribeEmail(e.target.value)}
        value={subscribeEmail}
        onKeyUp={onEnterKey}
      />
      <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
        <input type="text" name="b_5ce5e82d673fd2cfaf12849a5_e85a091ed3" tabIndex={-1} />
      </div>
      <div className={`${subscriptionSuccessful ? "" : "px-1 py-4"} border-b border-customLightGray relative`}>
        {subscribing && (
          <div className="flex items-center justify-between">
            <p>Submitting...</p> <div className="spinner"></div>
          </div>
        )}
        {subscriptionSuccessful && (
          <div className="bg-customYellow py-2 px-1">
            <p className="font-medium leading-[140%]">Subscribed Successfully!</p>
          </div>
        )}
        {!subscribing && !subscriptionSuccessful && (
          <SecondaryButton label={buttonLabel} handleClick={subscribeToNewsLetter} />
        )}
      </div>
    </div>
  );
};

export default NewsLetterSubscription;

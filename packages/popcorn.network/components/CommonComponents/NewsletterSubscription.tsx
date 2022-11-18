import React, { useState } from 'react'
import SecondaryButton from 'components/CommonComponents/SecondaryButton'
import useSubscribeToNewsletter from 'hooks/useSubscribeToNewsLetter'

const NewsletterSubscription = ({title,buttonLabel}) => {
	const [subscribeEmail, setSubscribeEmail] = useState<string>('')
	const { subscribeToNewsLetter, subscribing, subscriptionSuccessful } = useSubscribeToNewsletter();
	
	const subscribe = () => {
    subscribeToNewsLetter({
      email: subscribeEmail,
      onSuccess: () => {
        setSubscribeEmail("")
      }
    });
  }

  const onEnterKey = (e) => {
    if (e.key === "Enter") {
      subscribe()
    }
  };

	return (
		<div
				className="validate mt-12"
			>
				<h6 className="px-1 leading-6">{title}</h6>
				<input 
					type="email" 
					name="EMAIL" 
					id="mce-EMAIL" 
					className="border-t border-b border-customLightGray text-primaryDark placeholder-primaryDark px-1 py-2 w-full mt-2 leading-7" 
					placeholder="Enter your email"
					onChange={(e) => setSubscribeEmail(e.target.value)} 
					value={subscribeEmail} 
					onKeyUp={onEnterKey}
				/>
				<div
					style={{ position: 'absolute', left: '-5000px' }}
					aria-hidden="true"
				>
					<input
						type="text"
						name="b_5ce5e82d673fd2cfaf12849a5_e85a091ed3"
						tabIndex={-1}
					/>
				</div>
				<div className={`${subscriptionSuccessful ? '' : 'px-1 py-2'} border-b border-customLightGray relative`}>
					{subscribing && <div className='flex items-center justify-between'><p>Submitting...</p>	  <div className="spinner">
					</div></div>}
					{
						subscriptionSuccessful && <div className='bg-customYellow py-2 px-1'><p className='font-medium'>Subscribed Successfully!</p></div>
					}
					{!subscribing && !subscriptionSuccessful && <SecondaryButton label={buttonLabel} onClick={subscribe}/>}
				</div>

			</div>
	)
}

export default NewsletterSubscription
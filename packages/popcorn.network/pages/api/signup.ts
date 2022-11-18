import mailchimp from '@mailchimp/mailchimp_marketing';
import { NextApiRequest, NextApiResponse } from 'next';
import md5 from 'md5';

mailchimp.setConfig({
  apiKey: process.env.NEXT_PUBLIC_MAILCHIMP_API_KEY,
  server: process.env.NEXT_PUBLIC_MAILCHIMP_SERVER,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (typeof req.body === 'string') {
    req.body = JSON.parse(req.body);
  }
  const { email_address, status, merge_fields } = req.body;
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    // allow `POST` from all origins for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).send('OK');
  }

  try {
    const response = await mailchimp.lists.setListMember(
      process.env.NEXT_PUBLIC_MAILCHIMP_LIST_ID,
      md5(email_address.toLowerCase()),
      { email_address: email_address, status_if_new: 'subscribed' },
    );
  } catch (err) {
    console.log({ err, body: req.body });
    return res.status(400).send({ error: err });
  }

  return res.json({ success: true });
}

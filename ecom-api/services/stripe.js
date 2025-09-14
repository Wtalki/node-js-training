import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
export const stripe = stripeKey ? new Stripe(stripeKey) : null;
export const stripeEnabled = Boolean(stripeKey);
export const stripeCurrency = process.env.STRIPE_CURRENCY || 'usd';



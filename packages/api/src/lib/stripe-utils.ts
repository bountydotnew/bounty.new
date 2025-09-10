import { stripe } from './stripe';
import { db, userProfile } from '@bounty/db';
import { eq } from 'drizzle-orm';

export async function getOrCreateCustomer(userId: string, email: string) {
  const [profile] = await db
    .select({ stripeCustomerId: userProfile.stripeCustomerId })
    .from(userProfile)
    .where(eq(userProfile.userId, userId));

  if (profile?.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(profile.stripeCustomerId);
    return customer.id as string;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db
    .update(userProfile)
    .set({ stripeCustomerId: customer.id })
    .where(eq(userProfile.userId, userId));

  return customer.id;
}

export async function getOrCreateAccount(userId: string, email: string) {
  const [profile] = await db
    .select({ stripeAccountId: userProfile.stripeAccountId })
    .from(userProfile)
    .where(eq(userProfile.userId, userId));

  if (profile?.stripeAccountId) {
    const account = await stripe.accounts.retrieve(profile.stripeAccountId);
    return account.id as string;
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await db
    .update(userProfile)
    .set({ stripeAccountId: account.id })
    .where(eq(userProfile.userId, userId));

  return account.id;
}

export async function getAccountOnboardingUrl(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?stripe=onboarded`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}
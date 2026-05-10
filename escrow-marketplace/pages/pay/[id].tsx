import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createClient } from '@supabase/supabase-js';
import Nav from '../../components/Nav';
import styles from '../../styles/App.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PayPageProps {
  transaction: {
    id: string;
    item_name: string;
    full_amount: number;
    deposit_amount: number;
    status: string;
    stripe_payment_intent_client_secret: string;
  } | null;
  error?: string;
}

function CheckoutForm({ transactionId, depositDollars }: { transactionId: string, depositDollars: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [buyerEmail, setBuyerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    if (!buyerEmail) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${transactionId}`,
        receipt_email: buyerEmail,
      },
    });
    if (stripeError) {
      setError(stripeError.message || 'Payment failed.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.stripeWrap}>
        <div className={styles.stripeLabel}>Card details</div>
        <PaymentElement />
      </div>
      <div className={styles.formGroup} style={{ marginTop: 20 }}>
        <label>Your email</label>
        <input
          type="email"
          placeholder="buyer@email.com"
          value={buyerEmail}
          onChange={e => setBuyerEmail(e.target.value)}
        />
        <div className={styles.formHint}>Confirmation sent here after payment.</div>
      </div>
      {error && <div className={styles.errorMsg}>{error}</div>}
      <button className={styles.fullBtn} onClick={handleSubmit} disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Pay $${depositDollars} deposit →`}
      </button>
      <div className={styles.secureNote}>Secured by Stripe · Refundable if seller cancels</div>
    </div>
  );
}

const PayPage: NextPage<PayPageProps> = ({ transaction, error }) => {
  if (error || !transaction) {
    return (
      <>
        <Nav />
        <div className={styles.appWrap}>
          <div className={styles.appHeader}>
            <h2>Link not found</h2>
            <p>This deposit link is invalid or has expired.</p>
          </div>
        </div>
      </>
    );
  }

  if (transaction.status !== 'pending') {
    return (
      <>
        <Nav />
        <div className={styles.appWrap}>
          <div className={styles.appHeader}>
            <h2>Already paid</h2>
            <p>This deposit has already been paid.</p>
          </div>
        </div>
      </>
    );
  }

  const depositDollars = (transaction.deposit_amount / 100).toFixed(2);
  const fullDollars = (transaction.full_amount / 100).toFixed(2);
  const remainderDollars = ((transaction.full_amount - transaction.deposit_amount) / 100).toFixed(2);

  return (
    <>
      <Head>
        <title>Pay Deposit — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        <div className={styles.appHeader}>
          <h2>Pay deposit</h2>
          <p>Secure your purchase. The deposit holds the item until you meet.</p>
        </div>
        <div className={styles.txCard}>
          <div className={styles.txItem}>
            <span className={styles.txLabel}>Item</span>
            <span className={styles.txVal}>{transaction.item_name}</span>
          </div>
          <div className={styles.txItem}>
            <span className={styles.txLabel}>Full price</span>
            <span className={styles.txVal}>${fullDollars}</span>
          </div>
          <div className={styles.txItem}>
            <span className={styles.txLabel}>Deposit due now</span>
            <span className={`${styles.txVal} ${styles.txDeposit}`}>${depositDollars}</span>
          </div>
          <div className={styles.txItem}>
            <span className={styles.txLabel}>Remainder at meetup</span>
            <span className={styles.txVal} style={{ color: 'var(--muted)' }}>${remainderDollars}</span>
          </div>
        </div>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: transaction.stripe_payment_intent_client_secret,
            appearance: {
              theme: 'stripe',
              variables: {
                fontFamily: 'DM Sans, sans-serif',
                borderRadius: '10px',
                colorText: '#1a1a18',
                colorBackground: '#ffffff',
              },
            },
          }}
        >
          <CheckoutForm transactionId={transaction.id} depositDollars={depositDollars} />
        </Elements>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('transactions')
    .select('id, item_name, full_amount, deposit_amount, status, stripe_payment_intent_client_secret')
    .eq('id', id)
    .single();

  if (error || !data) return { props: { transaction: null, error: 'Not found' } };
  return { props: { transaction: data } };
};

export default PayPage;

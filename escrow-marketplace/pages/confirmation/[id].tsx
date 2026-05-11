import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createClient } from '@supabase/supabase-js';
import Nav from '../../components/Nav';
import styles from '../../styles/App.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Transaction {
  id: string;
  item_name: string;
  full_amount: number;
  deposit_amount: number;
  status: string;
  seller_email: string;
  buyer_email: string;
}

interface ConfirmPageProps {
  transaction: Transaction | null;
  view: 'buyer' | 'seller' | 'unknown';
}

// --- Remainder payment form (buyer only) ---
function RemainderForm({ transactionId, remainderDollars }: { transactionId: string, remainderDollars: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${transactionId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed.');
      setLoading(false);
    } else {
      setPaid(true);
    }
  };

  if (paid) return <p style={{ color: 'green', fontFamily: 'DM Sans, sans-serif' }}>Remainder paid ✓</p>;

  return (
    <div>
      <div className={styles.stripeWrap}>
        <div className={styles.stripeLabel}>Pay remainder — ${remainderDollars}</div>
        <PaymentElement />
      </div>
      {error && <div className={styles.errorMsg}>{error}</div>}
      <button className={styles.fullBtn} onClick={handlePay} disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Pay $${remainderDollars} →`}
      </button>
    </div>
  );
}

// --- Buyer view ---
function BuyerView({ transaction }: { transaction: Transaction }) {
  const [pinVerified, setPinVerified] = useState(false);
  const [remainderClientSecret, setRemainderClientSecret] = useState('');
  const [loadingRemainder, setLoadingRemainder] = useState(false);
  const [error, setError] = useState('');

  const depositDollars = (transaction.deposit_amount / 100).toFixed(2);
  const remainderDollars = ((transaction.full_amount - transaction.deposit_amount) / 100).toFixed(2);
  const fullDollars = (transaction.full_amount / 100).toFixed(2);

  const handlePinVerified = async () => {
    setPinVerified(true);
    setLoadingRemainder(true);
    setError('');
    try {
      const res = await fetch('/api/create-remainder-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load payment');
      setRemainderClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingRemainder(false);
    }
  };

  return (
    <div className={styles.confirmWrap}>
      <div className={styles.successIconLg}>✓</div>
      <h2>Deposit paid</h2>
      <p>At the meetup, read your PIN to the seller to unlock the remainder payment.</p>

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
          <span className={styles.txLabel}>Deposit paid</span>
          <span className={`${styles.txVal} ${styles.txGreen}`}>${depositDollars} ✓</span>
        </div>
        <div className={styles.txItem}>
          <span className={styles.txLabel}>Remainder due</span>
          <span className={styles.txVal}>${remainderDollars}</span>
        </div>
      </div>

      <PinDisplay transactionId={transaction.id} onVerified={handlePinVerified} pinVerified={pinVerified} />

      {error && <div className={styles.errorMsg}>{error}</div>}

      {pinVerified && (
        loadingRemainder ? (
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#555' }}>Loading payment…</p>
        ) : remainderClientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: remainderClientSecret,
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
            <RemainderForm transactionId={transaction.id} remainderDollars={remainderDollars} />
          </Elements>
        ) : null
      )}

      <div className={styles.txId}>
        Transaction ID: {transaction.id} · <span className={styles.statusPaid}>deposit_paid</span>
      </div>
    </div>
  );
}

// --- PIN display (buyer sees PIN, waits for seller to verify) ---
function PinDisplay({ transactionId, onVerified, pinVerified }: {
  transactionId: string;
  onVerified: () => void;
  pinVerified: boolean;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  // Fetch the PIN
  useState(() => {
    fetch(`/api/get-pin?transactionId=${transactionId}`)
      .then(r => r.json())
      .then(d => { setPin(d.pin || ''); setLoading(false); })
      .catch(() => setLoading(false));
  });

  if (loading) return <p style={{ fontFamily: 'DM Sans, sans-serif' }}>Loading PIN…</p>;

  if (pinVerified) {
    return (
      <div className={styles.pinBox}>
        <div className={styles.pinLabel}>PIN verified ✓</div>
      </div>
    );
  }

  return (
    <div className={styles.pinBox}>
      <div className={styles.pinLabel}>Your meetup PIN</div>
      <div className={styles.pinCode}>{pin}</div>
      <div className={styles.pinHint}>Read this to the seller. They'll enter it on their device to unlock your payment form.</div>
      <button
        className={styles.fullBtn}
        style={{ marginTop: 16 }}
        disabled={polling}
        onClick={async () => {
          setPolling(true);
          // Poll verify-pin with the pin we already have — seller side triggers this
          // For now just unlock manually after seller confirms verbally
          // In a future version this could be a long-poll
          onVerified();
        }}
      >
        Seller confirmed PIN — unlock payment
      </button>
    </div>
  );
}

// --- Seller view ---
function SellerView({ transaction }: { transaction: Transaction }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const depositDollars = (transaction.deposit_amount / 100).toFixed(2);
  const remainderDollars = ((transaction.full_amount - transaction.deposit_amount) / 100).toFixed(2);

  const handleVerify = async () => {
    if (!pin) { setError('Enter the PIN.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect PIN');
      setVerified(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.confirmWrap}>
      <div className={styles.successIconLg}>✓</div>
      <h2>Deposit received</h2>
      <p>Ask the buyer for their PIN and enter it below to confirm the meetup.</p>

      <div className={styles.txCard}>
        <div className={styles.txItem}>
          <span className={styles.txLabel}>Item</span>
          <span className={styles.txVal}>{transaction.item_name}</span>
        </div>
        <div className={styles.txItem}>
          <span className={styles.txLabel}>Deposit received</span>
          <span className={`${styles.txVal} ${styles.txGreen}`}>${depositDollars} ✓</span>
        </div>
        <div className={styles.txItem}>
          <span className={styles.txLabel}>Remainder to collect</span>
          <span className={styles.txVal}>${remainderDollars}</span>
        </div>
      </div>

      {!verified ? (
        <div>
          <div className={styles.formGroup}>
            <label>Enter buyer's PIN</label>
            <input
              className={styles.pinInput}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="______"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <button className={styles.fullBtn} onClick={handleVerify} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify PIN →'}
          </button>
        </div>
      ) : (
        <div className={styles.pinBox}>
          <div className={styles.pinLabel}>PIN verified ✓</div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#555' }}>
            The buyer's payment form is now unlocked. Collect ${remainderDollars} at meetup.
          </p>
        </div>
      )}

      <div className={styles.txId}>
        Transaction ID: {transaction.id} · <span className={styles.statusPaid}>deposit_paid</span>
      </div>
    </div>
  );
}

// --- Main page ---
const ConfirmPage: NextPage<ConfirmPageProps> = ({ transaction, view }) => {
  if (!transaction) {
    return (
      <>
        <Nav />
        <div className={styles.appWrap}>
          <div className={styles.appHeader}><h2>Transaction not found</h2></div>
        </div>
      </>
    );
  }

  if (transaction.status === 'completed') {
    return (
      <>
        <Head><title>Complete — D&apos;Posit</title></Head>
        <Nav />
        <div className={styles.confirmWrap}>
          <div className={styles.successIconLg}>✓</div>
          <h2>Transaction complete</h2>
          <p>All done. Enjoy your item!</p>
          <div className={styles.txId}>Transaction ID: {transaction.id} · <span className={styles.statusComplete}>completed</span></div>
        </div>
      </>
    );
  }

  if (transaction.status !== 'deposit_paid') {
    return (
      <>
        <Nav />
        <div className={styles.appWrap}>
          <div className={styles.appHeader}>
            <h2>Deposit not yet paid</h2>
            <p>This transaction is still pending.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Confirmation — D&apos;Posit</title></Head>
      <Nav />
      {view === 'seller' && <SellerView transaction={transaction} />}
      {view === 'buyer' && <BuyerView transaction={transaction} />}
      {view === 'unknown' && (
        <div className={styles.appWrap}>
          <div className={styles.appHeader}>
            <h2>Access restricted</h2>
            <p>Log in to view this transaction.</p>
          </div>
        </div>
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const id = params?.id as string;

  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseServer
    .from('transactions')
    .select('id, item_name, full_amount, deposit_amount, status, seller_email, buyer_email')
    .eq('id', id)
    .single();

  if (error || !data) return { props: { transaction: null, view: 'unknown' } };

  // Determine view from auth cookie
  const authHeader = req.cookies['sb-access-token'] ||
    req.cookies[`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`];

  let userEmail = '';

  if (authHeader) {
    try {
      const { data: { user } } = await supabaseServer.auth.getUser(authHeader);
      userEmail = user?.email ?? '';
    } catch (_) {}
  }

  let view: 'buyer' | 'seller' | 'unknown' = 'unknown';
  if (userEmail && userEmail === data.seller_email) view = 'seller';
  else if (userEmail && userEmail === data.buyer_email) view = 'buyer';
  else if (data.buyer_email) view = 'buyer'; // guest buyer — show buyer view

  return {
    props: {
      transaction: {
        id: data.id,
        item_name: data.item_name,
        full_amount: data.full_amount,
        deposit_amount: data.deposit_amount,
        status: data.status,
        seller_email: data.seller_email,
        buyer_email: data.buyer_email,
      },
      view,
    },
  };
};

export default ConfirmPage;

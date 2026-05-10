import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import QRCode from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Nav from '../../components/Nav';
import styles from '../../styles/App.module.css';

interface ConfirmPageProps {
  transaction: {
    id: string;
    item_name: string;
    full_amount: number;
    deposit_amount: number;
    status: string;
  } | null;
  qrValue: string;
  qrSecret: string;
}

const ConfirmPage: NextPage<ConfirmPageProps> = ({ transaction, qrValue, qrSecret }) => {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  if (!transaction) {
    return (
      <>
        <Nav />
        <div className={styles.appWrap}>
          <div className={styles.appHeader}>
            <h2>Transaction not found</h2>
          </div>
        </div>
      </>
    );
  }

  const depositDollars = (transaction.deposit_amount / 100).toFixed(2);
  const remainderDollars = ((transaction.full_amount - transaction.deposit_amount) / 100).toFixed(2);

  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    try {
      // Fetch fresh secret at click time to avoid SSR race condition
      const { data: freshData } = await supabase
        .from('transactions')
        .select('qr_code_secret')
        .eq('id', transaction.id)
        .single();

      const res = await fetch('/api/complete-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id, qrSecret: freshData?.qr_code_secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete');
      setCompleted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (completed || transaction.status === 'completed') {
    return (
      <>
        <Head><title>Complete — D&apos;Posit</title></Head>
        <Nav />
        <div className={styles.confirmWrap}>
          <div className={styles.successIconLg}>✓</div>
          <h2>Transaction complete</h2>
          <p>Funds have been released. Enjoy your item!</p>
          <div className={styles.txId}>Transaction ID: {transaction.id} · <span className={styles.statusComplete}>completed</span></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Confirmation — D&apos;Posit</title></Head>
      <Nav />
      <div className={styles.confirmWrap}>
        <div className={styles.successIconLg}>✓</div>
        <h2>Deposit paid</h2>
        <p>Show this QR code at the meetup to complete the transaction.</p>
        <div className={styles.qrBox}>
          <div className={styles.qrHolder}>
            <QRCode value={qrValue || 'pending'} size={160} bgColor="#f0efe9" fgColor="#1a1a18" />
          </div>
          <div className={styles.qrLabel}>Scan to complete</div>
          <div className={styles.qrDetails}>
            <div className={styles.txItem}>
              <span className={styles.txLabel}>Item</span>
              <span className={styles.txVal}>{transaction.item_name}</span>
            </div>
            <div className={styles.txItem}>
              <span className={styles.txLabel}>Deposit paid</span>
              <span className={`${styles.txVal} ${styles.txGreen}`}>${depositDollars} ✓</span>
            </div>
            <div className={styles.txItem}>
              <span className={styles.txLabel}>Due at meetup</span>
              <span className={styles.txVal}>${remainderDollars}</span>
            </div>
          </div>
        </div>
        {error && <div className={styles.errorMsg}>{error}</div>}
        <button className={styles.fullBtn} onClick={handleComplete} disabled={completing}>
          {completing ? 'Completing...' : 'Complete transaction →'}
        </button>
        <div className={styles.txId}>
          Transaction ID: {transaction.id} · <span className={styles.statusPaid}>deposit_paid</span>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabaseServer
    .from('transactions')
    .select('id, item_name, full_amount, deposit_amount, status, qr_code_secret')
    .eq('id', id)
    .single();

  if (error || !data) return { props: { transaction: null, qrValue: '', qrSecret: '' } };

  console.log('transaction status:', data.status, 'qr_code_secret:', data.qr_code_secret);

  const isPaid = data.status === 'deposit_paid' || data.status === 'completed';

  const qrValue = isPaid
    ? `${process.env.NEXT_PUBLIC_APP_URL}/confirmation/${id}`
    : '';

  const qrSecret = isPaid ? data.qr_code_secret : '';

  return {
    props: {
      transaction: {
        id: data.id,
        item_name: data.item_name,
        full_amount: data.full_amount,
        deposit_amount: data.deposit_amount,
        status: data.status,
      },
      qrValue,
      qrSecret,
    },
  };
};

export default ConfirmPage;

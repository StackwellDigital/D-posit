import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import styles from '../styles/App.module.css';
import { supabase } from '@/lib/supabase';

const GenerateLink: NextPage = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [itemName, setItemName] = useState('');
  const [fullPrice, setFullPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUserEmail(session.user.email ?? '');
        setAuthLoading(false);
      }
    });
  }, [router]);

  const remainder = () => {
    const f = parseFloat(fullPrice) || 0;
    const d = parseFloat(depositAmount) || 0;
    const r = f - d;
    return r > 0 ? `$${r.toFixed(2)} remaining balance` : 'remaining balance';
  };

  const handleGenerate = async () => {
    if (!itemName || !fullPrice || !depositAmount) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          sellerEmail: userEmail,
          fullAmount: Math.round(parseFloat(fullPrice) * 100),
          depositAmount: Math.round(parseFloat(depositAmount) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create link');
      const url = `${window.location.origin}/pay/${data.transactionId}`;
      setGeneratedUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedUrl('');
    setItemName('');
    setFullPrice('');
    setDepositAmount('');
    setCopied(false);
    setError('');
  };

  if (authLoading) return null;

  return (
    <>
      <Head>
        <title>Generate Link — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        <div className={styles.appHeader}>
          <h2>Generate a deposit link</h2>
          <p>Set your price and deposit amount. Share the link with your buyer.</p>
        </div>

        {!generatedUrl ? (
          <div>
            <div className={styles.formGroup}>
              <label>Item name</label>
              <input
                type="text"
                placeholder="e.g. 2018 Trek FX3 — black, size M"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Full asking price</label>
              <div className={styles.inputWrap}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  className="has-currency"
                  placeholder="450"
                  value={fullPrice}
                  onChange={e => setFullPrice(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Deposit amount</label>
              <div className={styles.inputWrap}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  className="has-currency"
                  placeholder="50"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                />
              </div>
              <div className={styles.formHint}>Typically 10–20% of asking price. Buyer pays remainder at meetup.</div>
            </div>
            <div className={styles.feeNote}>
              Buyer pays the deposit now via Stripe. The <strong>{remainder()}</strong> is collected at meetup.
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button className={styles.fullBtn} onClick={handleGenerate} disabled={loading}>
              {loading ? 'Creating...' : 'Generate link →'}
            </button>
          </div>
        ) : (
          <div>
            <div className={styles.successRow}>
              <div className={styles.successIcon}>✓</div>
              <div>
                <div className={styles.successTitle}>Link created</div>
                <div className={styles.successSub}>Share this with your buyer</div>
              </div>
            </div>
            <div className={styles.linkBox}>
              <div className={styles.linkLabel}>Your deposit link</div>
              <div className={styles.linkUrl}>{generatedUrl}</div>
              <button
                className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <div className={styles.feeNote} style={{ marginTop: 16 }}>
              Paste this link anywhere — your FB listing, Kijiji ad, or send it directly via DM.
            </div>
            <button className={`${styles.fullBtn} ${styles.secondary}`} style={{ marginTop: 16 }} onClick={handleReset}>
              Create another link
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default GenerateLink;

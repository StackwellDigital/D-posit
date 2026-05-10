import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Nav from '../components/Nav';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>D&apos;Posit — Escrow for used goods</title>
        <meta name="description" content="Add a deposit link to any listing. Buyers commit, sellers show up. No scams, no no-shows." />
      </Head>

      <Nav />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.badge}>platform-agnostic escrow</div>
          <h1>Sell anything,<br /><strong>meet safely.</strong></h1>
          <p>Add a deposit link to any listing — Facebook, Kijiji, Craigslist. Buyers commit, sellers show up. No scams, no no-shows.</p>
          <div className={styles.actions}>
            <Link href="/generate-link">
              <button className={styles.btnPrimary}>Create a free link</button>
            </Link>
            <button className={styles.btnGhost} onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </button>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.how} id="how">
          <div className={styles.sectionLabel}>How it works</div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <h3>Set your deposit</h3>
              <p>Enter your asking price and deposit amount. Get a shareable link in seconds.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <h3>Buyer pays deposit</h3>
              <p>They pay via Stripe — no account needed. Funds are held securely until meetup.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <h3>Scan to complete</h3>
              <p>At the meetup, scan the QR code. Transaction completes, funds are released.</p>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className={styles.trust}>
          <div className={styles.sectionLabel}>Why D&apos;Posit</div>
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <h4>Works everywhere</h4>
              <p>Paste your link into any listing. FB Marketplace, Kijiji, Craigslist — doesn&apos;t matter.</p>
            </div>
            <div className={styles.trustCard}>
              <h4>Stripe-secured</h4>
              <p>All payments handled by Stripe. PCI compliant, bank-grade encryption, zero card data on our end.</p>
            </div>
            <div className={styles.trustCard}>
              <h4>No account needed</h4>
              <p>Buyers pay instantly. Sellers just generate a link. No friction, no sign-up walls.</p>
            </div>
          </div>
        </section>

        {/* CTA Band */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaInner}>
            <h2>Ready to sell with confidence?</h2>
            <p>Free to use. Takes 30 seconds to set up.</p>
            <Link href="/generate-link">
              <button className={styles.btnWhite}>Create your first link</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;

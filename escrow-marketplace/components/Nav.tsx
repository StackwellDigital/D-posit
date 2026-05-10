import Link from 'next/link';
import styles from './Nav.module.css';

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        D&apos;Posit <span>— escrow</span>
      </Link>
      <div className={styles.links}>
        <Link href="/">Home</Link>
        <Link href="/generate-link">Generate Link</Link>
      </div>
      <Link href="/generate-link">
        <button className={styles.cta}>Create link →</button>
      </Link>
    </nav>
  );
}

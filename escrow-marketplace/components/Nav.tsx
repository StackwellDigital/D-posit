import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import styles from './Nav.module.css';

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        D&apos;Posit <span>— escrow</span>
      </Link>
      <div className={styles.links}>
        <Link href="/">Home</Link>
        <Link href="/generate-link">Generate Link</Link>
      </div>
      <div className={styles.navRight}>
        {loggedIn && (
          <button className={styles.logout} onClick={handleLogout}>Log out</button>
        )}
        <Link href="/generate-link">
          <button className={styles.cta}>Create link →</button>
        </Link>
      </div>
    </nav>
  );
}

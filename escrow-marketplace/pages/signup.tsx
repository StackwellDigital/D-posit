import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '@/styles/Auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.sub}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then <Link href="/login">log in</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Sellers need an account to generate deposit links.</p>
        <form onSubmit={handleSignup} className={styles.form}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className={styles.footer}>Already have an account? <Link href="/login">Log in</Link></p>
      </div>
    </div>
  );
}

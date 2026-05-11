// pages/connect/return.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/App.module.css'

export default function ConnectReturn() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'complete' | 'incomplete'>('checking')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/connect-status', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (data.chargesEnabled) {
        setStatus('complete')
        // Auto-redirect after 2 seconds
        setTimeout(() => router.push('/generate-link'), 2000)
      } else {
        setStatus('incomplete')
      }
    }
    check()
  }, [])

  return (
    <>
      <Head>
        <title>Stripe Setup — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        {status === 'checking' && (
          <div className={styles.appHeader}>
            <h2>Verifying your account...</h2>
            <p>Just a moment.</p>
          </div>
        )}

        {status === 'complete' && (
          <>
            <div className={styles.appHeader}>
              <h2>You're all set ✓</h2>
              <p>Your Stripe account is connected. Redirecting you to generate your first link...</p>
            </div>
            <div className={styles.feeNote}>
              <strong>✓ Payments active.</strong> Deposits and remainder payments will transfer directly to your bank account.
            </div>
          </>
        )}

        {status === 'incomplete' && (
          <>
            <div className={styles.appHeader}>
              <h2>Almost there</h2>
              <p>Your Stripe account needs a bit more information before you can accept payments.</p>
            </div>
            <div className={styles.feeNote}>
              This usually means Stripe needs to verify your identity or bank details. It only takes a minute.
            </div>
            <button className={styles.fullBtn} onClick={() => router.push('/connect')}>
              Complete Stripe setup →
            </button>
          </>
        )}
      </div>
    </>
  )
}

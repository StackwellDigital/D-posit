// pages/connect.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/App.module.css'

type ConnectStatus = 'loading' | 'not_started' | 'pending' | 'complete'

export default function ConnectPage() {
  const router = useRouter()
  const [status, setStatus] = useState<ConnectStatus>('loading')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/connect-status', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()

      if (!data.connected) setStatus('not_started')
      else if (data.chargesEnabled) setStatus('complete')
      else setStatus('pending')
    }
    check()
  }, [])

  const handleConnect = async () => {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // Step 1 — create express account if needed
      const accountRes = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const accountData = await accountRes.json()
      if (!accountRes.ok) throw new Error(accountData.error)

      // Step 2 — get onboarding link
      const linkRes = await fetch('/api/create-account-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const linkData = await linkRes.json()
      if (!linkRes.ok) throw new Error(linkData.error)

      // Step 3 — redirect to Stripe onboarding
      window.location.href = linkData.url

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  if (status === 'loading') return null

  return (
    <>
      <Head>
        <title>Connect Stripe — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        <div className={styles.appHeader}>
          {status === 'complete' && <h2>Stripe connected ✓</h2>}
          {status === 'pending' && <h2>Finish setting up Stripe</h2>}
          {status === 'not_started' && <h2>Connect your Stripe account</h2>}

          {status === 'complete' && (
            <p>You're all set. Payments go directly to your connected account.</p>
          )}
          {status === 'pending' && (
            <p>Your Stripe account isn't fully set up yet. Complete onboarding to start accepting payments.</p>
          )}
          {status === 'not_started' && (
            <p>Set up a free Stripe account to receive payments directly. Takes about 2 minutes.</p>
          )}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {status === 'complete' && (
          <>
            <div className={styles.feeNote}>
              <strong>✓ Stripe account active.</strong> Deposit and remainder payments transfer directly to your bank after each completed transaction.
            </div>
            <button className={styles.fullBtn} onClick={() => router.push('/generate-link')}>
              Generate a deposit link →
            </button>
            <button
              className={`${styles.fullBtn} ${styles.secondary}`}
              style={{ marginTop: 12 }}
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Reconnect Stripe account'}
            </button>
          </>
        )}

        {(status === 'not_started' || status === 'pending') && (
          <>
            <div className={styles.feeNote}>
              No existing Stripe account needed — we'll create one for you and walk you through setup. Your bank details stay between you and Stripe.
            </div>
            <button className={styles.fullBtn} onClick={handleConnect} disabled={loading}>
              {loading ? 'Setting up...' : status === 'pending' ? 'Continue Stripe setup →' : 'Set up Stripe payments →'}
            </button>
          </>
        )}
      </div>
    </>
  )
}

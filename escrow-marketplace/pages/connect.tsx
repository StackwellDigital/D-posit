import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/App.module.css'

export default function ConnectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alreadyConnected, setAlreadyConnected] = useState(false)
  const { error } = router.query

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('stripe_connect_id')
        .eq('id', session.user.id)
        .single()

      setAlreadyConnected(!!profile?.stripe_connect_id)
      setLoading(false)
    }
    check()
  }, [])

  const handleConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID!,
      scope: 'read_write',
      redirect_uri: `${window.location.origin}/api/stripe-connect-callback`,
      state: session.user.id,
    })

    window.location.href = `https://connect.stripe.com/oauth/authorize?${params}`
  }

  if (loading) return null

  return (
    <>
      <Head>
        <title>Connect Stripe — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        <div className={styles.appHeader}>
          <h2>{alreadyConnected ? 'Stripe connected' : 'Connect your Stripe account'}</h2>
          <p>
            {alreadyConnected
              ? "You're all set. Payments will be sent directly to your Stripe account."
              : "D'Posit pays you directly when a transaction completes. Connect your Stripe account to get started."}
          </p>
        </div>

        {error && (
          <div className={styles.errorMsg}>
            Something went wrong during Stripe setup. Please try again.
          </div>
        )}

        {alreadyConnected ? (
          <>
            <div className={styles.feeNote}>
              <strong>✓ Stripe account linked.</strong> Deposit and remainder payments will transfer directly to your connected account after each completed transaction.
            </div>
            <button className={styles.fullBtn} onClick={() => router.push('/generate-link')}>
              Generate a deposit link →
            </button>
            <button
              className={`${styles.fullBtn} ${styles.secondary}`}
              style={{ marginTop: 12 }}
              onClick={handleConnect}
            >
              Reconnect Stripe account
            </button>
          </>
        ) : (
          <>
            <div className={styles.feeNote}>
              You'll be redirected to Stripe to authorize D'Posit to send payments to your account. This takes about 2 minutes.
            </div>
            <button className={styles.fullBtn} onClick={handleConnect}>
              Connect with Stripe →
            </button>
          </>
        )}
      </div>
    </>
  )
}

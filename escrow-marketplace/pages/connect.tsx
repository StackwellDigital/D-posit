// pages/connect.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/App.module.css'

export default function ConnectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alreadyConnected, setAlreadyConnected] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: user } = await supabase
        .from('users')
        .select('stripe_connect_id')
        .eq('id', session.user.id)
        .single()

      if (user?.stripe_connect_id) {
        setAlreadyConnected(true)
      }
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
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe-connect-callback`,
      state: session.user.id,
    })

    window.location.href = `https://connect.stripe.com/oauth/authorize?${params}`
  }

  if (loading) return <div className={styles.container}><p>Loading...</p></div>

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Connect Your Stripe Account</h1>
        {alreadyConnected ? (
          <>
            <p className={styles.meta}>✅ Your Stripe account is connected.</p>
            <button className={styles.button} onClick={() => router.push('/generate-link')}>
              Go to Generate Link
            </button>
          </>
        ) : (
          <>
            <p className={styles.meta}>
              D'Posit uses Stripe to pay you directly when a transaction completes.
              Connect your Stripe account to get started.
            </p>
            <button className={styles.button} onClick={handleConnect}>
              Connect with Stripe
            </button>
          </>
        )}
      </div>
    </div>
  )
}

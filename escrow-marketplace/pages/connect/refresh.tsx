// pages/connect/refresh.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/App.module.css'

export default function ConnectRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Onboarding link expired — generate a fresh one
    const refresh = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/create-account-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        router.push('/connect')
      }
    }
    refresh()
  }, [])

  return (
    <>
      <Head>
        <title>Stripe Setup — D&apos;Posit</title>
      </Head>
      <Nav />
      <div className={styles.appWrap}>
        <div className={styles.appHeader}>
          <h2>Refreshing your setup link...</h2>
          <p>You'll be redirected to Stripe in a moment.</p>
        </div>
      </div>
    </>
  )
}

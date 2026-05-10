// pages/pay/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabase'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function CheckoutForm({ transactionId, depositAmount }: { transactionId: string; depositAmount: number }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create payment intent
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          buyerEmail: email,
          depositAmount,
        }),
      })

      const { clientSecret, qrSecret } = await res.json()

      // Confirm payment
      const { error: stripeError } = await stripe!.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements!.getElement(CardElement)!,
            billing_details: { email },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message!)
        return
      }

      // Success - redirect to confirmation page
      router.push(`/confirmation/${transactionId}?qrSecret=${qrSecret}`)
    } catch (err) {
      setError('Payment failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3">
          <CardElement />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay Deposit ($${(depositAmount / 100).toFixed(2)})`}
      </button>
    </form>
  )
}

export default function PayPage() {
  const router = useRouter()
  const { id } = router.query
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchTransaction = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()
      setTransaction(data)
      setLoading(false)
    }

    fetchTransaction()
  }, [id])

  if (loading) return <div className="p-4 text-center">Loading...</div>
  if (!transaction) return <div className="p-4 text-center">Transaction not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-2xl font-bold mb-4">Secure Deposit</h1>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between pb-3 border-b">
              <span className="text-gray-600">Deposit Amount:</span>
              <span className="font-bold text-lg">
                ${(transaction.deposit_amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Item Price:</span>
              <span className="text-gray-700">
                ${(transaction.full_amount / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              ✓ Your deposit is held securely until you both confirm the transaction
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold mb-6">Pay with Card</h2>
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              transactionId={id as string} 
              depositAmount={transaction.deposit_amount}
            />
          </Elements>
        </div>
      </div>
    </div>
  )
}

// pages/confirmation/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import QRCode from 'qrcode.react'
import { supabase } from '@/lib/supabase'

export default function ConfirmationPage() {
  const router = useRouter()
  const { id, qrSecret } = router.query
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

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

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/complete-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: id,
          qrSecret,
        }),
      })

      if (res.ok) {
        setCompleted(true)
        // Refresh transaction status
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .single()
        setTransaction(data)
      } else {
        alert('Failed to complete transaction')
      }
    } catch (error) {
      console.error('Error completing transaction:', error)
      alert('Error completing transaction')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (!transaction) return <div className="p-4">Transaction not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Deposit Confirmed!</h1>

        {transaction.status === 'deposit_paid' && (
          <>
            <p className="text-gray-600 mb-6">
              Your deposit of ${(transaction.deposit_amount / 100).toFixed(2)} has been received.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-6 flex flex-col items-center">
              <p className="text-sm font-medium text-gray-600 mb-4">
                Show this QR code at pickup:
              </p>
              <QRCode
                value={JSON.stringify({
                  transactionId: transaction.id,
                  qrSecret,
                })}
                size={256}
                level="H"
              />
            </div>

            <div className="space-y-2 mb-6 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Next Steps:</span>
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                <li>Meet the seller at the agreed time</li>
                <li>Inspect the item</li>
                <li>Ask the seller to scan the QR code</li>
                <li>Payment will be released to seller</li>
              </ol>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700"
            >
              Complete Transaction
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Only click this after the seller has scanned the QR code and you've received the item.
            </p>
          </>
        )}

        {transaction.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">Transaction Complete!</p>
            <p className="text-green-700 text-sm mt-2">
              Payment of ${(transaction.full_amount / 100).toFixed(2)} has been released to the seller.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

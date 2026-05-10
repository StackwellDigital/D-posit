// pages/generate-link.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function GenerateLink() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [fullAmount, setFullAmount] = useState('')
  const [description, setDescription] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setGeneratedLink('')

    try {
      // Get or create seller user
      let { data: seller } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!seller) {
        const { data: newSeller } = await supabase
          .from('users')
          .insert({ email })
          .select()
          .single()
        seller = newSeller
      }

      // Create a transaction record (no listing needed)
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          seller_id: seller.id,
          deposit_amount: Math.round(parseFloat(depositAmount) * 100),
          full_amount: Math.round(parseFloat(fullAmount) * 100),
          status: 'pending',
          qr_code_secret: Math.random().toString(36).substring(2, 15),
        })
        .select()
        .single()

      // Generate shareable link
      const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${transaction.id}`
      setGeneratedLink(shareLink)
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">D'Posit - Generate Deposit Link</h1>
          <p className="text-gray-600">
            Create a secure deposit link and send it to your buyer. Works with any platform.
          </p>
        </div>

        {!generatedLink ? (
          <div className="bg-white rounded-lg shadow p-8">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">We'll use this to pay you</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">What buyer pays now</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fullAmount}
                    onChange={(e) => setFullAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="800"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total item price</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., iPhone 14, mint condition"
                />
                <p className="text-xs text-gray-500 mt-1">Shows to buyer (optional)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate Deposit Link'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-green-900 mb-4">✓ Link Generated!</h2>
              <p className="text-green-800 mb-6">
                Send this link to your buyer via text, email, messenger, or paste in your listing.
              </p>

              <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Your Secure Link:</p>
                <code className="text-sm font-mono break-all text-blue-600">
                  {generatedLink}
                </code>
              </div>

              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    alert('Link copied to clipboard!')
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    const text = `I'm selling an item and using D'Posit for secure payment. Here's the deposit link: ${generatedLink}`
                    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700"
                >
                  Send via SMS
                </button>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">What happens next:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
                  <li>Buyer clicks your link</li>
                  <li>They enter their email and pay the deposit securely via Stripe</li>
                  <li>You get notified that they've paid</li>
                  <li>Meet up at agreed time to complete the transaction</li>
                  <li>Buyer scans QR code to release remaining payment to you</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => {
                setGeneratedLink('')
                setEmail('')
                setDepositAmount('')
                setFullAmount('')
                setDescription('')
              }}
              className="w-full bg-gray-200 text-gray-900 py-2 rounded-md font-medium hover:bg-gray-300"
            >
              Generate Another Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

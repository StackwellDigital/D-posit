// pages/index.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6">D'Posit - Escrow for Any Deal</h1>
        <p className="text-xl mb-12 opacity-90">
          Found an item on Facebook Marketplace? Kijiji? Craigslist? Secure the deposit with D'Posit. Works with any platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Link href="/generate-link">
            <div className="bg-white text-gray-900 rounded-lg p-8 cursor-pointer hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-4">I'm Selling</h2>
              <p className="text-gray-600 mb-6">
                Generate a secure deposit link. Send to buyers on any platform. Get paid when they show up.
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
                Generate Link
              </button>
            </div>
          </Link>

          <div className="bg-white text-gray-900 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">I'm Buying</h2>
            <p className="text-gray-600 mb-6">
              Seller sent you a D'Posit link? Paste it below to securely pay the deposit.
            </p>
            <input
              type="text"
              placeholder="Paste your D'Posit link or code"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
            />
            <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
              Pay Deposit
            </button>
          </div>
        </div>

        <div className="bg-blue-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">How D'Posit Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">1</div>
              <h3 className="font-bold mb-2">Share a Link</h3>
              <p className="opacity-90">Seller generates deposit link, sends to buyer (SMS, email, messenger)</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2</div>
              <h3 className="font-bold mb-2">Buyer Pays</h3>
              <p className="opacity-90">Buyer clicks link, securely pays deposit via Stripe</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">3</div>
              <h3 className="font-bold mb-2">Meet & Release</h3>
              <p className="opacity-90">At pickup, scan QR code. Funds release to seller instantly</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Works With Everything</h3>
          <p className="mb-6 opacity-90">
            Facebook Marketplace • Kijiji • Craigslist • OfferUp • Local Instagram • Text Message
          </p>
          <p className="text-sm opacity-75">
            Found an item anywhere? Use D'Posit to secure it.
          </p>
        </div>
      </div>
    </div>
  )
}

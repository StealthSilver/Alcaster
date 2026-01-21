import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BookCallPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Build Your Family Tree
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Start preserving your family history today. Schedule a call with our
            team to get started.
          </p>

          {/* Add your booking widget or form here */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <p className="text-white/70">
              Booking functionality coming soon...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

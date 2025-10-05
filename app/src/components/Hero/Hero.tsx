import Link from 'next/link';
import GetStarted from './GetStarted/GetStarted';

export default function StatusHero() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">Real-Time System Status</h1>
      <p className="text-lg md:text-xl text-gray-300 mb-8">
        Stay up-to-date with the current health of our services. Transparent updates, 24/7.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <Link
          href="/profile/applications"
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-md transition duration-300"
        >
          View Current Status
        </Link>
        <Link
          href="/dashboard"
          className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-2xl border border-gray-700 shadow-md transition duration-300"
        >
          Subscribe to Updates
        </Link>
      </div>

      <GetStarted />
    </div>
  );
}

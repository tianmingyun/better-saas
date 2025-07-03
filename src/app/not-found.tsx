'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-bold text-9xl text-gray-900">404</h1>

        <h2 className="mb-4 font-semibold text-2xl text-gray-800">Oops! Page Not Found!</h2>

        <p className="mb-8 text-gray-600 leading-relaxed">
          It seems like the page you're looking for
          <br />
          does not exist or might have been removed.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

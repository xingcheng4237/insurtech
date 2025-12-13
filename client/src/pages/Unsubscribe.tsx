import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Unsubscribe() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  const unsubscribeMutation = trpc.subscription.unsubscribe.useMutation();

  useEffect(() => {
    if (token && !unsubscribeMutation.isSuccess && !unsubscribeMutation.isError) {
      unsubscribeMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {unsubscribeMutation.isPending && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing...
            </h1>
            <p className="text-gray-600">
              Please wait while we unsubscribe you from the newsletter.
            </p>
          </>
        )}

        {unsubscribeMutation.isSuccess && unsubscribeMutation.data.success && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Unsubscribed
            </h1>
            <p className="text-gray-600 mb-6">
              {unsubscribeMutation.data.message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will no longer receive the Insurtech News Daily Digest.
              We're sorry to see you go!
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </>
        )}

        {(unsubscribeMutation.isError || (unsubscribeMutation.isSuccess && !unsubscribeMutation.data.success)) && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unsubscribe Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {unsubscribeMutation.isError 
                ? 'An error occurred while unsubscribing.' 
                : unsubscribeMutation.data?.message || 'Invalid or expired unsubscribe link.'}
            </p>
            <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
              Return to Homepage
            </Button>
          </>
        )}

        {!token && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-600 mb-6">
              No unsubscribe token provided. Please check your email for the correct link.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
              Return to Homepage
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

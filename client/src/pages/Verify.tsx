import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Verify() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  const verifyMutation = trpc.subscription.verify.useMutation();

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {verifyMutation.isPending && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email...
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your subscription.
            </p>
          </>
        )}

        {verifyMutation.isSuccess && verifyMutation.data.success && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              {verifyMutation.data.message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You'll start receiving the Insurtech News Daily Digest at 9:00 AM SGT every day.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </>
        )}

        {(verifyMutation.isError || (verifyMutation.isSuccess && !verifyMutation.data.success)) && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {verifyMutation.isError 
                ? 'An error occurred during verification.' 
                : verifyMutation.data?.message || 'Invalid or expired verification link.'}
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
              No verification token provided. Please check your email for the correct link.
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

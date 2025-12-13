import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Mail, Check } from 'lucide-react';

export function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const subscribeMutation = trpc.subscription.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsSubmitted(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to subscribe');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    subscribeMutation.mutate({ email, name: name || undefined });
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-green-200 rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Your Email!
        </h3>
        <p className="text-gray-600 text-sm">
          We've sent a verification link to <strong>{email}</strong>.
          Please click the link to confirm your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Subscribe to Daily Digest
        </h3>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">
        Get daily insurtech news and AI-powered insights delivered to your inbox at 9:00 AM SGT.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
        
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>

      <p className="text-xs text-gray-500 mt-3">
        By subscribing, you agree to receive daily email digests. You can unsubscribe at any time.
      </p>
    </div>
  );
}

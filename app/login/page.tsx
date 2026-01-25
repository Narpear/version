'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store user in localStorage (simple auth for now)
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <h1 className="heading-pixel text-center mb-8">VERSION</h1>
        <p className="text-center font-mono text-lg mb-6">Your Wellbeing Tracker</p>

        <form onSubmit={handleLogin}>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="mb-4 p-3 bg-warning border-2 border-darkgray">
              <p className="text-pixel-sm text-darkgray">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Start!'}
          </Button>
        </form>

        <p className="text-center font-mono text-sm mt-6 text-darkgray/70">
          First time?{' '}
          <a href="/signup" className="text-primary underline">
            Create account
          </a>
        </p>
      </Card>
    </div>
  );
}
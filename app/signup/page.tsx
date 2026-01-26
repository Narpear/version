'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          // Default values - will be updated in onboarding
          height_cm: 160,
          age: 25,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Store that they need onboarding
        localStorage.setItem('needsOnboarding', 'true');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="heading-pixel mb-4">Success!</h1>
          <p className="font-mono text-lg">Account created! Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <h1 className="heading-pixel text-center mb-4">Create Account</h1>
        <p className="text-center font-mono text-lg mb-6">Join VERSION</p>

        <form onSubmit={handleSignup}>
          <Input
            type="text"
            label="Name"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="Your Name"
            required
          />

          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="your@email.com"
            required
          />

          <Input
            type="password"
            label="Password"
            value={formData.password}
            onChange={handleChange('password')}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="mb-4 p-3 bg-warning border-2 border-darkgray">
              <p className="text-pixel-sm text-darkgray">{error}</p>
            </div>
          )}

          <p className="text-center font-mono text-xs mt-4 text-darkgray/50">
            By signing up, you agree to our{' '}
            <a href="/privacy" className="text-primary underline">
              Privacy Policy
            </a>
          </p>
          <br></br>

          <Button type="submit" disabled={loading} className="w-full mb-4">
            {loading ? 'Creating...' : 'Create Account'}
          </Button>

          <p className="text-center font-mono text-sm text-darkgray/70">
            Already have an account?{' '}
            <a href="/login" className="text-primary underline">
              Login
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Welcome Back, {user.name || 'Player'}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Today's Stats">
          <p className="font-mono text-lg">No data yet - start tracking!</p>
        </Card>

        <Card title="Weekly Progress">
          <p className="font-mono text-lg">Coming soon...</p>
        </Card>

        <Card title="Goals">
          <p className="font-mono text-lg">Set your goals in Profile</p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="subheading-pixel">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-pixel">Log Food</button>
          <button className="btn-pixel-secondary">Log Workout</button>
          <button className="btn-pixel-success">Track Water</button>
        </div>
      </div>
    </div>
  );
}
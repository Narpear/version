import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Privacy & Data Security</h1>
      
      <Card title="Your Privacy Matters" className="mb-6">
        <div className="space-y-4 font-mono text-sm">
          <div>
            <p className="font-bold mb-2">What we store</p>
            <ul className="list-none space-y-1 ml-4">
              <li>• Account info: email, name, age, height, gender</li>
              <li>• Logs you enter: weight, food, workouts, water, skincare</li>
              <li>• Goals you set: loss/gain/maintenance and your target weight</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-2">Who can see your data</p>
            <p>
              Your data is tied to your account. Other users cannot see it.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Data sharing</p>
            <p>
              We do not sell your data. We do not share it with third parties for advertising.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Where your data lives</p>
            <p>
              Data is stored in a hosted database (Supabase) and transmitted over HTTPS.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Can the developer read my data?</p>
            <p>
              As the app developer, I avoid looking at individual user data. If you report an issue and want help,
              you can explicitly give permission for troubleshooting.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Delete my account/data</p>
            <p>
              Contact the developer and request deletion. We’ll delete your account and associated data.
            </p>
          </div>

          <div className="p-4 bg-warning/20 border-2 border-darkgray mt-4">
            <p className="font-bold mb-2">Important</p>
            <p>
              This is a personal wellness tracker, not a medical app. Don’t store sensitive medical information here.
              For medical advice, talk to a healthcare professional.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-darkgray/70">
              Contact the developer: {' '}
              <a href="mailto:prer.kulk@gmail.com" className="text-primary underline">
                prer.kulk@gmail.com
              </a>
            </p>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/">
          <button className="btn-pixel">Back to Dashboard</button>
        </Link>
      </div>
    </div>
  );
}
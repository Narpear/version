import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Privacy & Data Security</h1>
      
      <Card title="[===] Your Privacy Matters" className="mb-6">
        <div className="space-y-4 font-mono text-sm">
          <div>
            <p className="font-bold mb-2">[?] What data we collect:</p>
            <ul className="list-none space-y-1 ml-4">
              <li>• Account info: Email, name, age, height, gender</li>
              <li>• Tracking data: Weight, food logs, workout logs, water intake, skincare routines</li>
              <li>• Goals: Your weight goals and progress</li>
            </ul>
          </div>
          
          <div>
            <p className="font-bold mb-2">[!] Who can see your data:</p>
            <p className="text-success">
              [✓] Only you. Your data is protected by Row Level Security (RLS) at the database level.
            </p>
            <p className="mt-2">
              Even if there's a bug in the app code, other users cannot access your information.
            </p>
          </div>
          
          <div>
            <p className="font-bold mb-2">[?] Can the developer see my data?</p>
            <p>
              Technically, as the database owner, I could view data. However, I commit to:
            </p>
            <ul className="list-none space-y-1 ml-4 mt-2">
              <li>• Never accessing individual user data for any reason</li>
              <li>• Only viewing aggregated/anonymous statistics (like "total users")</li>
              <li>• Only accessing your data if you specifically report a bug and give permission</li>
            </ul>
          </div>
          
          <div>
            <p className="font-bold mb-2">[#] Where is my data stored?</p>
            <p>
              All data is stored securely on Supabase, a trusted database platform with:
            </p>
            <ul className="list-none space-y-1 ml-4 mt-2">
              <li>• Industry-standard encryption</li>
              <li>• Regular security audits</li>
              <li>• SOC 2 Type II compliance</li>
              <li>• Data centers in secure locations</li>
            </ul>
          </div>

          <div>
            <p className="font-bold mb-2">[*] How is my data protected?</p>
            <ul className="list-none space-y-1 ml-4">
              <li>• Passwords are hashed (never stored in plain text)</li>
              <li>• Row Level Security prevents unauthorized access</li>
              <li>• HTTPS encryption for all data transmission</li>
              <li>• No tracking cookies or analytics</li>
            </ul>
          </div>
          
          <div>
            <p className="font-bold mb-2">[x] Data sharing:</p>
            <p className="text-success">
              [✓] We NEVER sell, share, or give your data to third parties.
            </p>
            <p className="mt-2">
              Your data stays between you and this app. Period.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">[~] Can I delete my data?</p>
            <p>
              Yes! You can request to delete your account and all associated data anytime.
              Just contact me and I'll delete everything within 48 hours.
            </p>
          </div>
          
          <div className="p-4 bg-warning/20 border-2 border-darkgray mt-4">
            <p className="font-bold mb-2">[!] Important Disclaimer:</p>
            <p>
              This is a personal wellness tracking app, not a medical app. 
              It is not HIPAA-compliant and should not be used to store sensitive medical information.
              Always consult healthcare professionals for medical advice.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-darkgray/70">
              Questions about privacy?{' '}
              <a href="mailto:your-email@example.com" className="text-primary underline">
                Contact me
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
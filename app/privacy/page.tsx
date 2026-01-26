import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container-pixel">
      <h1 className="heading-pixel">Privacy & Your Wellbeing</h1>
      
      <Card title="I've Got Your Back" className="mb-6">
        <div className="space-y-4 font-mono text-sm">
          <p className="text-base mb-4">
            Your health journey is personal, and I treat it that way. Here's everything you need to know about how I handle your data with transparency and care.
          </p>

          <div className="p-4 bg-lightgray/50 border-2 border-darkgray/30 rounded mb-4">
            <p className="font-bold mb-2">A personal note</p>
            <p>
              I originally built this app for myself to track my own wellness journey, and I actively use it every day. 
              I'm sharing it with friends because I think it's useful, but it's designed around healthy, sustainable habits—not 
              to promote unhealthy eating or exercising behaviors. This is a tool I use to stay accountable to my own health 
              goals in a balanced way.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">What information I store</p>
            <p className="mb-2">
              Your data includes your profile information (email, name, age, height, gender), daily logs (weight, meals, workouts, water intake, skincare routines), and the goals you've set for yourself. Everything is tied directly to your account and stored securely.
            </p>
            <p className="text-darkgray/80">
              Think of this as your personal vault—all your wellness data lives in one secure place, accessible only to you.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Privacy and data access</p>
            <p className="mb-2">
              Your data is completely private. Other users cannot see your information, and I've implemented Row Level Security (RLS) policies in the database to enforce this at the infrastructure level. This means the database itself prevents unauthorized access to your data—it's not just an app-level check.
            </p>
            <p className="mb-2">
              I don't sell your data to anyone, ever. I don't share it with advertisers, third parties, or data brokers. Your wellness journey is yours alone, and I have no business model that involves monetizing your personal information.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Technical security measures</p>
            <p className="mb-2">
              Your data is stored in Supabase, a trusted open-source backend platform built on PostgreSQL. Supabase provides enterprise-grade security, automatic backups, and infrastructure maintained by a dedicated team. All data transmission happens over HTTPS, which means your information is encrypted in transit.
            </p>
            <p className="mb-2">
              Row Level Security (RLS) is enabled on all database tables, which means every database query automatically filters data to show you only your own records. Even if there were a bug in the application code, the database layer provides an additional security boundary.
            </p>
            <p className="text-darkgray/80">
              Authentication is handled securely through Supabase Auth, which manages password hashing, session tokens, and secure login flows so you don't have to worry about the technical details.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Developer data access</p>
            <p className="mb-2">
              I want to be clear: I do not look at your personal data. Your logs, goals, and daily entries are private, and I respect that boundary completely. The app is designed to work without any need for me to access individual user information.
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">Deleting your data</p>
            <p>
              You're always in control of your information. If you want to delete your account and all associated data, just send me an email and I'll take care of it promptly. Once deleted, your data is permanently removed from the systems.
            </p>
          </div>

          <div className="p-4 bg-primary/10 border-2 border-primary mt-6 rounded">
            <p className="font-bold mb-3 text-base">My Health Philosophy</p>
            <p className="mb-2">
              This app is built to support healthy, balanced wellness habits. I believe in maintaining a healthy BMI range for long-term health and disease prevention, practicing sustainable and balanced nutrition rather than restrictive dieting, and setting realistic goals that support your overall wellbeing.
            </p>
            <p className="font-semibold">
              I do not promote or encourage unhealthy eating habits, extreme weight loss, disordered eating behaviors, or any practices that could harm your physical or mental health. Your wellbeing comes first, always.
            </p>
          </div>

          <div className="p-4 bg-warning/20 border-2 border-darkgray mt-4 rounded">
            <p className="font-bold mb-2">Important Medical Disclaimer</p>
            <p>
              This is a personal wellness tracker designed to help you build healthy habits—it's not a medical app or a substitute for professional healthcare. Please don't store sensitive medical information here. For medical advice, diagnosis, treatment, or if you have concerns about your health, always consult with a qualified healthcare professional.
            </p>
          </div>

          <div className="mt-6 text-center p-4 bg-lightgray/30 rounded">
            <p className="mb-2">Questions or concerns about your privacy?</p>
            <p className="text-darkgray/90">
              Feel free to reach out: {' '}
              <a href="mailto:prer.kulk@gmail.com" className="text-primary underline font-semibold">
                prer.kulk@gmail.com
              </a>
            </p>
            <p className="text-sm text-darkgray/70 mt-2">
              I'm here to make sure your wellness journey is secure and supportive.
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
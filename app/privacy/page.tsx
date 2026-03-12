import Link from 'next/link';
import { Shield, Heart, Lock, Trash2, Database, Server, AlertCircle, Mail, FileText, Cookie, EyeOff, KeyRound, Bell, Clock, UserCheck } from 'lucide-react';

const Section = ({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="border-2 border-darkgray p-5 mb-4" style={{ backgroundColor: 'var(--color-surface)' }}>
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-9 h-9 flex items-center justify-center border-2 border-darkgray shrink-0"
        style={{ backgroundColor: color }}
      >
        <Icon size={18} />
      </div>
      <h3 className="text-pixel-sm">{title}</h3>
    </div>
    <div className="font-mono text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </div>
);

export default function PrivacyPage() {
  return (
    <div className="container-pixel" style={{ maxWidth: '48rem' }}>

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-16 h-16 flex items-center justify-center border-4 border-darkgray mb-4"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Shield size={32} />
        </div>
        <h1 className="heading-pixel text-2xl mb-0">Privacy Policy</h1>
        <p className="font-mono text-sm" style={{ opacity: 0.5 }}>Last updated: March 2026</p>
      </div>

      {/* Personal note banner */}
      <div className="border-4 border-darkgray p-5 mb-8 relative" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div
          className="absolute -top-3 left-4 border-2 border-darkgray px-3 py-0.5"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span className="text-pixel-xs">A NOTE FROM THE DEVELOPER</span>
        </div>
        <div className="flex gap-3 mt-1 items-start">
          <Heart size={20} className="shrink-0 mt-0.5" />
          <p className="font-mono text-sm leading-relaxed">
            I built this app for myself and use it every single day. I'm sharing it with friends because I think it's genuinely useful — not to build a business. Your data is safe, private, and will never be used against you. That's a promise.
          </p>
        </div>
      </div>

      {/* Sections */}
      <Section icon={Database} title="WHAT I STORE" color="var(--color-secondary)">
        <p>Your profile info (name, email, age, height, gender), daily logs (weight, meals, workouts, water, skincare), and your goals. Everything is tied to your account and only accessible by you.</p>
        <p className="font-mono text-xs" style={{ opacity: 0.5 }}>Think of it as your personal wellness vault.</p>
      </Section>

      <Section icon={EyeOff} title="WHAT I DO NOT COLLECT" color="var(--color-secondary)">
        <p>I deliberately do not collect or store any of the following:</p>
        <div className="mt-2 space-y-1.5">
          {[
            'IP addresses or location data',
            'Device identifiers or fingerprints',
            'Browsing behavior or analytics events',
            'Any data beyond what you explicitly enter into the app',
          ].map((item) => (
            <div key={item} className="flex gap-2 items-start">
              <span className="shrink-0">✗</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs mt-2" style={{ opacity: 0.5 }}>There is no tracking, no analytics pipeline, and no ad targeting of any kind.</p>
      </Section>

      <Section icon={Lock} title="YOUR DATA IS PRIVATE" color="var(--color-accent)">
        <p>Other users <strong>cannot</strong> see your data. I've implemented Row Level Security (RLS) in the database — this enforces privacy at the infrastructure level, not just in app code. Even a bug in the app can't expose your data to others.</p>
        <p>I don't sell your data. I don't share it with advertisers or third parties. Zero. Never.</p>
      </Section>

      <Section icon={KeyRound} title="PASSWORD SECURITY" color="var(--color-lavender)">
        <p>Your password is <strong>never stored in plaintext</strong>. When you create an account, your password is hashed using a secure one-way algorithm before being saved to the database. This means that even I cannot see or recover your password — only you know it.</p>
        <p>If you forget your password, it cannot be retrieved. You would need to reset it.</p>
        <p className="font-mono text-xs mt-1" style={{ opacity: 0.5 }}>The authentication system is custom-built and does not rely on third-party auth providers.</p>
      </Section>

      <Section icon={Server} title="THIRD-PARTY SERVICES" color="var(--color-lavender)">
        <p>This app uses a small number of trusted services to function:</p>
        <div className="mt-2 space-y-2">
          {[
            { name: 'Supabase', desc: 'Database storage — enterprise-grade security built on PostgreSQL, all access is logged and audited' },
            { name: 'Vercel', desc: 'Hosting and deployment — the server that serves the app to your browser' },
            { name: 'Google Fonts', desc: 'Loads the pixel fonts used in the UI (Press Start 2P and VT323)' },
          ].map(({ name, desc }) => (
            <div key={name} className="flex gap-2 items-start">
              <span className="font-bold shrink-0">▸ {name}:</span>
              <span style={{ opacity: 0.7 }}>{desc}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs mt-2" style={{ opacity: 0.5 }}>None of these services receive your personal health data beyond what is necessary to run the app.</p>
      </Section>

      <Section icon={Cookie} title="LOCAL STORAGE" color="var(--color-warning)">
        <p>When you log in, your basic profile (name, email, user ID) is saved to your browser's <code className="px-1 border border-darkgray/30" style={{ backgroundColor: 'var(--color-background)' }}>localStorage</code>. This keeps you logged in between visits, never leaves your device, and is cleared when you log out.</p>
        <p className="font-mono text-xs mt-1" style={{ opacity: 0.5 }}>Your light/dark mode preference is also stored locally in your browser.</p>
      </Section>

      <Section icon={FileText} title="DEVELOPER ACCESS" color="var(--color-primary)">
        <p>As the sole developer, I technically have access to the database. However — <strong>I do not look at your personal data.</strong> Your logs, goals, and daily entries are yours. Any database access I perform (e.g. for maintenance or debugging) is automatically logged and audited by Supabase.</p>
      </Section>

      <Section icon={Clock} title="DATA RETENTION" color="var(--color-warning)">
        <p>Your data is retained for as long as your account is active. I do not automatically delete data from inactive accounts — your history will be there whenever you come back.</p>
        <p>If you choose to delete your account, all associated data is permanently and irreversibly removed from the database. There is no recovery after deletion.</p>
      </Section>

      <Section icon={Trash2} title="YOUR DATA, YOUR CONTROL" color="#FFDFD3">
        <p>You're always in control. You can:</p>
        <div className="mt-2 space-y-1.5">
          {[
            'Request a full export of all your data',
            'Delete your account and all associated data permanently',
            "Ask any questions about what's stored and why",
          ].map((item) => (
            <div key={item} className="flex gap-2 items-start">
              <span className="shrink-0">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-2">Just email me and I'll take care of it promptly.</p>
      </Section>

      <Section icon={Bell} title="POLICY CHANGES AND SECURITY INCIDENTS" color="var(--color-accent)">
        <p><strong>Policy changes:</strong> If this privacy policy ever changes in a meaningful way, I will notify all registered users by email before the changes take effect. You'll always know what you're agreeing to.</p>
        <p><strong>Security incidents:</strong> In the unlikely event of a data breach or security incident, I will notify all affected users by email within <strong>24 hours</strong> of becoming aware of it, with clear information about what happened and what steps are being taken.</p>
      </Section>

      <Section icon={UserCheck} title="WHO THIS APP IS FOR" color="var(--color-primary)">
        <p>This app is intended for users aged <strong>16 and older</strong>. If you are under 16, please do not create an account or submit any personal information.</p>
        <p className="font-mono text-xs mt-1" style={{ opacity: 0.5 }}>If you believe a user under 16 has created an account, please contact me and I will remove their data promptly.</p>
      </Section>

      <Section icon={AlertCircle} title="HEALTH PHILOSOPHY" color="var(--color-accent)">
        <p>This app is built to support <strong>healthy, balanced, sustainable</strong> habits. I don't promote extreme weight loss, restrictive dieting, or disordered eating. Your wellbeing comes first, always.</p>
        <div
          className="mt-3 p-3 border-2 border-darkgray font-mono text-xs"
          style={{ backgroundColor: 'var(--color-warning)' }}
        >
          <strong>Medical Disclaimer:</strong> This is a personal wellness tracker, not a medical app and not a substitute for professional healthcare. For medical advice or health concerns, always consult a qualified healthcare professional.
        </div>
      </Section>

      {/* Contact */}
      <div
        className="border-4 border-darkgray p-6 mb-8 flex flex-col items-center text-center"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        <div
          className="w-10 h-10 flex items-center justify-center border-2 border-darkgray mb-3"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          <Mail size={20} />
        </div>
        <p className="text-pixel-sm mb-2">QUESTIONS OR CONCERNS?</p>
        <p className="font-mono text-sm mb-3" style={{ opacity: 0.7 }}>I'm a real person and I actually respond.</p>
        <a
          href="mailto:prer.kulk@gmail.com"
          className="font-mono text-sm font-bold underline transition-opacity hover:opacity-70"
        >
          prer.kulk@gmail.com
        </a>
      </div>

      <div className="text-center mb-8">
        <Link href="/">
          <button className="btn-pixel">Back to Dashboard</button>
        </Link>
      </div>

    </div>
  );
}
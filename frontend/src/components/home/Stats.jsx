import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';


export default function Stats() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-col justify-center items-center gap-1 w-full max-w-7xl mx-auto py-8">
            <h1></h1>
            <StatCard icon={<LockIcon />} subtitle="Secure" text="Your exams are protected" />
            {/* security (check synap), Impact (helped x students), Built to scale (synap) */}
        </div>
    )
}

function StatCard({ icon, subtitle, text }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 p-4">
            {icon}
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-3xl font-bold">{subtitle}</h2>
                <p className="text-center">{text}</p>
            </div>
        </div>
    )
}

// to be changed to a simpler icon later
function LockIcon() {
  return (
    <div className="flex items-center justify-center p-4 rounded-2xl bg-gray-100 dark:bg-white">
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="10" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 10V8a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <path d="M12 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { FaLock } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { FaPeopleGroup } from "react-icons/fa6";
import { ShieldCheck, GraduationCap, Database } from "@phosphor-icons/react";

export default function Stats() {
    const { t } = useTranslation();
    const tstat = (key) => t(`Home.stats.${key}`);
    
    return (
        <div className="flex flex-col md:flex-row justify-center items-center gap-1 w-full max-w-7xl mx-auto py-8">
            <StatCard 
              icon={<ShieldCheck size={64} weight="duotone" className="text-emerald-600" />} 
              subtitle={tstat("secure")} 
              text={tstat("secure_desc")} 
            />
            <StatCard 
              icon={<GraduationCap size={64} weight="duotone" className="text-amber-500" />} 
              subtitle={tstat("impact")} 
              text={tstat("impact_desc")} 
            />
            <StatCard 
              icon={<Database size={64} weight="duotone" className="text-indigo-600" />} 
              subtitle={tstat("robust")} 
              text={tstat("robust_desc")} 
            />
        </div>
    )
}

function StatCard({ icon, subtitle, text }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 w-72 lg:w-full p-4">
            {icon}
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-3xl font-bold text-foreground">{subtitle}</h2>
                <p className="text-center text-muted-foreground">{text}</p>
            </div>
        </div>
    )
}

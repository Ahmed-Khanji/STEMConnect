import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

export default function Hero() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <h1 className="text-5xl lg:text-7xl text-center
                font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
                {t("hero.title")}
            </h1>

            <p className="text-lg lg:text-xl text-center max-w-3xl mx-auto px-4
                leading-relaxed"
            >
                {t("hero.paragraph")}
            </p>

            <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-2 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
                {t("hero.GetStarted")}
            </button>
        </div>
    )
}
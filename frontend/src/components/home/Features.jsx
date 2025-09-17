import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function Features() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full max-w-7xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-8">
        {t("features.title")}
      </h2>
      <div className="flex flex-wrap gap-6 justify-center">
        {/* Card 1 */}
        <div className="flex-none w-full md:w-[420px] lg:w-[360px] h-36 md:px-3 rounded-xl border">
          <icon></icon>
          <h3></h3>
          <p></p>
        </div>

        {/* Card 2 */}
        <div className="flex-none w-full md:w-[420px] lg:w-[360px] h-36 md:px-3 rounded-xl border">
        
        </div>

        {/* Card 3: centered on md, normal on lg */}
        <div className="flex-none w-full md:w-[420px] lg:w-[360px] h-36 md:px-3 md:mx-auto lg:mx-0 rounded-xl border">

        </div>
      </div>
    </section>
  )
}

export default Features
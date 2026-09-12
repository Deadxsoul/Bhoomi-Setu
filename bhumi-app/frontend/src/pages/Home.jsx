import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

// Three layers of the same kind of field/land photography, scrolled at
// different rates to create a sense of depth (CSS-only parallax — no
// three.js needed for this effect, keeps the bundle light).
const SKY_LAYER = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=60&w=2000&auto=format&fit=crop';
const FIELD_LAYER = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?fm=jpg&q=70&w=2000&auto=format&fit=crop';
const FOREGROUND_LAYER = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?fm=jpg&q=70&w=2000&auto=format&fit=crop';

export default function Home() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOffset(el.scrollTop));
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    client.get('/dashboard/summary').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const isGuest = !!user?.guest;
  const displayName = user?.name || (isGuest ? t('dashboard.guest') : '');

  return (
    <div ref={scrollRef} className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden relative">
      {/* ---------- Parallax hero ---------- */}
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${SKY_LAYER})`, transform: `translateY(${offset * 0.15}px)`, filter: 'saturate(0.85) brightness(0.75)' }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${FIELD_LAYER})`, transform: `translateY(${offset * 0.35}px)`, opacity: 0.85, mixBlendMode: 'multiply' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-cover bg-bottom"
          style={{ backgroundImage: `url(${FOREGROUND_LAYER})`, transform: `translateY(${offset * 0.55}px)`, filter: 'saturate(0.9)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-moss/90 via-moss/70 to-cream" />
        <div className="absolute inset-0 bg-ink/25" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-paper">
          <p className="text-sm tracking-wide opacity-90 mb-2">{t('home.greeting')}{displayName ? `, ${displayName}` : ''}</p>
          <h1 className="font-display text-4xl md:text-5xl max-w-2xl leading-tight mb-4">{t('home.heroTitle')}</h1>
          <p className="max-w-md text-paper/85 mb-8">{t('home.heroSubtitle')}</p>
          <div className="animate-bounce text-paper/70 text-2xl">↓</div>
        </div>
      </div>

      {/* ---------- Content layer ---------- */}
      <div className="relative bg-cream px-6 py-16">
        {/* About the platform */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl text-ink mb-3">{t('home.aboutTitle')}</h2>
          <p className="text-ink-soft leading-relaxed max-w-2xl mb-8">{t('home.aboutDesc')}</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['stageProposal', 'stageSurvey', 'stageCompensation', 'stagePossession', 'stageRehab'].map((key, i) => (
              <div key={key} className="card text-center py-4">
                <div className="w-7 h-7 rounded-full bg-moss text-paper text-xs font-semibold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
                <div className="text-xs font-medium text-ink">{t(`home.${key}`)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Aadhaar registration — the "next layer" */}
          <div className="card flex flex-col justify-between bg-gradient-to-br from-moss to-sage-3 text-paper border-none">
            <div>
              <h2 className="font-display text-2xl mb-2">{t('home.aadhaarCardTitle')}</h2>
              <p className="text-paper/85 text-sm leading-relaxed mb-6">{t('home.aadhaarCardDesc')}</p>
            </div>
            <button
              onClick={() => navigate('/app/aadhaar')}
              disabled={isGuest}
              className="self-start bg-paper text-moss px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('home.aadhaarCardCta')}
            </button>
          </div>

          {/* Straight into the app */}
          <div className="card flex flex-col justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink mb-2">{t('home.exploreTitle')}</h2>
              <p className="text-ink-soft text-sm leading-relaxed mb-6">{t('home.exploreDashboardDesc')}</p>
            </div>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="self-start btn-primary"
            >
              {t('home.exploreDashboardCta')}
            </button>
          </div>
        </div>

        {stats && (
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 mt-8">
            <StatCard label={t('home.statParcels')} value={stats.totalParcels ?? '—'} />
            <StatCard label={t('home.statProjects')} value={stats.totalProjects ?? '—'} />
            <StatCard label={t('home.statCompensation')} value={stats.paidCompensation ? `₹${Number(stats.paidCompensation).toLocaleString('en-IN')}` : '—'} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card text-center py-6">
      <div className="font-display text-2xl text-moss mb-1">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}

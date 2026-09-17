import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  const roleLabel = user.guest ? t('dashboard.guest') : user.role ? t(`roles.${user.role}`, user.role) : '';
  const isPolice = user.role === 'police';

  function go(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <div className="bg-moss text-paper sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link to="/app/home" className="font-display font-semibold text-lg">
          {t('appName')}
        </Link>

        <nav className="flex flex-wrap gap-1 text-sm">
          <NavLink
            to="/app/home"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md ${isActive ? 'bg-paper text-moss font-semibold' : 'hover:bg-sage-3'}`
            }
          >
            {t('nav.home', 'Home')}
          </NavLink>
          <NavLink
            to="dashboard"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md ${isActive ? 'bg-paper text-moss font-semibold' : 'hover:bg-sage-3'}`
            }
          >
            {t('nav.dashboard')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex gap-1">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-0.5 rounded text-xs ${i18n.language === 'en' ? 'bg-paper text-moss font-medium' : 'text-paper/80'}`}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage('hi')}
              className={`px-2 py-0.5 rounded text-xs ${i18n.language === 'hi' ? 'bg-paper text-moss font-medium' : 'text-paper/80'}`}
            >
              हिं
            </button>
          </div>
          <span className="opacity-90 hidden sm:inline">
            {user.name || roleLabel} · <span className="uppercase text-xs bg-sage-3 px-2 py-0.5 rounded">{roleLabel}</span>
          </span>

          {/* ---------- Hamburger / profile menu ---------- */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="w-9 h-9 flex flex-col items-center justify-center gap-[3px] rounded-md hover:bg-sage-3 transition"
            >
              <span className="block w-5 h-0.5 bg-paper rounded" />
              <span className="block w-5 h-0.5 bg-paper rounded" />
              <span className="block w-5 h-0.5 bg-paper rounded" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-paper text-ink rounded-xl shadow-lg border border-stone overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                <div className="px-4 py-3 border-b border-stone bg-cream">
                  <p className="font-medium text-sm truncate">{user.name || t('dashboard.guest')}</p>
                  <p className="text-xs text-ink-soft uppercase">{roleLabel}</p>
                </div>

                <button
                  onClick={() => go('/app/profile')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream flex items-center gap-2"
                >
                  👤 {t('menu.profile')}
                </button>

                <button
                  onClick={() => go('/app/land-transactions')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream flex items-center gap-2"
                >
                  🌾 {t('menu.buySellLand')}
                </button>

                <button
                  onClick={() => go('/app/land-transactions/history')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream flex items-center gap-2"
                >
                  🕓 {t('menu.landHistory', 'Land History')}
                </button>

                {isPolice && (
                  <button
                    onClick={() => go('/app/land-transactions/queue')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream flex items-center gap-2"
                  >
                    🛡️ {t('menu.verificationQueue')}
                  </button>
                )}

                <button
                  onClick={() => go('/app/schemes')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream flex items-center gap-2"
                >
                  📜 {t('menu.schemes', 'Government Schemes')}
                </button>

                <button
                  onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-700 border-t border-stone flex items-center gap-2"
                >
                  🚪 {t('menu.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (!user) return null;

  const roleLabel = user.guest ? t('dashboard.guest') : user.role ? t(`roles.${user.role}`, user.role) : '';

  return (
    <div className="bg-moss text-paper sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link to="/app/dashboard" className="font-display font-semibold text-lg">
          {t('appName')}
        </Link>

        <nav className="flex flex-wrap gap-1 text-sm">
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
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="bg-paper text-moss px-3 py-1 rounded-md text-xs font-semibold hover:bg-cream"
          >
            {t('dashboard.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-sage-3 text-paper text-lg leading-none"
      >
        ☰
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-paper text-ink rounded-xl shadow-xl border border-stone overflow-hidden z-50">
          {!user.guest && (
            <div className="px-4 py-3 border-b border-stone">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-ink-soft">{user.phone}</div>
            </div>
          )}

          <button
            onClick={() => go('/app/profile')}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream"
          >
            Profile
          </button>

          <button
            onClick={() => go('/app/land-market')}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream"
          >
            Buy & Sell Land
          </button>

          {user.role === 'police' && (
            <button
              onClick={() => go('/app/police-queue')}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream"
            >
              Verification Queue
            </button>
          )}

          <button
            onClick={() => go('/app/schemes')}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream"
          >
            Government Schemes
          </button>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream border-t border-stone text-red-700"
          >
            {t('dashboard.logout', 'Log out')}
          </button>
        </div>
      )}
    </div>
  );
}

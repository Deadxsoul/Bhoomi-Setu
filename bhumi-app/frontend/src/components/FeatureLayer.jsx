const BANNERS = {
  dashboard: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  projects: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  map: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  compensation: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  possession: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  rehabilitation: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  documents: 'https://images.unsplash.com/photo-1568667256549-094345857637?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  satellite: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  ranking: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  chatbot: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  reports: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  landTransactions: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  landHistory: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  profile: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?fm=jpg&q=70&w=1600&auto=format&fit=crop',
};

export default function FeatureLayer({ id, title, subtitle, children }) {
  return (
    <div className="animate-[fadeIn_0.35s_ease-out]">
      <div
        className="relative h-56 md:h-64 flex items-end bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(43,40,32,0.35) 0%, rgba(43,40,32,0.55) 55%, #F5F1E6 100%), url(${BANNERS[id] || BANNERS.dashboard})`,
        }}
      >
        <div className="max-w-6xl mx-auto w-full px-6 pb-6">
          <h1 className="font-display text-3xl md:text-4xl text-paper mb-1">{title}</h1>
          {subtitle && <p className="text-paper/85 text-sm max-w-xl">{subtitle}</p>}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8 -mt-2 space-y-6">{children}</div>
    </div>
  );
}

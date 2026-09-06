export default function StatCard({ title, value, icon: Icon, sub, color = 'text-gray-900', iconBg = 'bg-brand-50 text-brand-600' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <span className={`rounded-lg p-2 ${iconBg}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
}
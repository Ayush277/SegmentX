
function Sidebar() {
  const links = [
    { name: 'Dashboard', href: '#', key: 'dashboard' },
    { name: 'Customers', href: '#', key: 'customers' },
    { name: 'Campaigns', href: '#', key: 'campaigns' },
    { name: 'Analytics', href: '#', key: 'analytics' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-6">Marketing CRM</h1>
        <nav className="space-y-2">
          {links.map(l => (
            <a key={l.key} href={l.href} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              {l.name}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MetricCard({ title, value, hint }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  // placeholder values; the frontend should fetch real data from the API
  const metrics = [
    { title: 'Total Customers', value: '1,234' },
    { title: 'Total Orders', value: '4,567' },
    { title: 'Active Campaigns', value: '3' },
    { title: 'Total Messages Sent', value: '12,345' }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <MetricCard key={m.title} title={m.title} value={m.value} />
        ))}
      </div>

      <div className="mt-8">
        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium mb-2">Overview</h3>
          <p className="text-sm text-gray-600">This dashboard will display charts and trends for campaigns, customer activity, and message performance.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <main className="ml-64 p-6">
        <Dashboard />
      </main>
    </div>
  );
}

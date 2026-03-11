'use client';
import { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldAlert, BarChart3, Search, UserMinus, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const usersRes = await fetch(`${API_URL}/api/admin/users`, { headers });
      const reportsRes = await fetch(`${API_URL}/api/admin/reports`, { headers });
      
      if (usersRes.ok && reportsRes.ok) {
        setUsers(await usersRes.json());
        setReports(await reportsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/block`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email, reason: 'Violated terms' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to block user');
    }
  };

  const handleUnblock = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/unblock`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to unblock user');
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c]">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">CC Admin</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'users', icon: Users, label: 'User List' },
            { id: 'reports', icon: AlertTriangle, label: 'Reports' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'reports' && 'Chat Reports'}
              {activeTab === 'analytics' && 'Platform Analytics'}
            </h2>
            <p className="text-gray-500">Manage and moderate the CampusConnect platform.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 outline-none focus:ring-1 focus:ring-indigo-500"
                />
             </div>
             <button onClick={fetchData} className="glass px-4 py-2 rounded-xl text-sm font-medium">Refresh</button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Verified</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs ${user.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {user.is_verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-md text-xs ${user.is_blocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_blocked ? (
                          <button 
                            onClick={() => handleUnblock(user.email)}
                            className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-colors"
                          >
                            <UserCheck className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBlock(user.email)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'reports' && (
               <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Reporter</th>
                    <th className="px-6 py-4 font-medium">Reported</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">{report.reporter_email}</td>
                      <td className="px-6 py-4 font-medium text-red-400">{report.reported_email}</td>
                      <td className="px-6 py-4 text-gray-400">{report.reason}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(report.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded-md text-xs bg-yellow-500/10 text-yellow-500">
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'analytics' && (
              <div className="p-20 text-center text-gray-500">
                Analytics engine connecting...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

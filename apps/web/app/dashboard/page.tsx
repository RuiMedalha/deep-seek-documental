'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Upload,
  Download,
  Wallet,
  CheckCircle,
  AlertCircle,
  LogOut,
  Menu,
  Search,
  Bell,
  Zap,
  ChevronRight,
  Building2,
  Calendar,
  FolderOpen,
  Settings,
  Globe,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: Activity, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: FileText, label: 'Documentos', href: '/documents' },
    { icon: Wallet, label: 'Financeiro', href: '/finance' },
    { icon: Calendar, label: 'Calendário', href: '/calendar' },
    { icon: Target, label: 'Conciliação', href: '/reconciliation' },
    { icon: Users, label: 'CRM', href: '/crm' },
    { icon: FolderOpen, label: 'Pastas', href: '/folders' },
    { icon: Globe, label: 'Internacional', href: '/international' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  const statCards = [
    {
      title: 'Documentos',
      value: stats?.documents?.total || 0,
      subValue: `${stats?.documents?.thisMonth || 0} este mês`,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Despesas Mensais',
      value: `€${(stats?.expenses?.thisMonth || 0).toLocaleString('pt-PT')}`,
      subValue: `${stats?.expenses?.total || 0} total`,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
    },
    {
      title: 'Faturas Pendentes',
      value: stats?.invoices?.pending || 0,
      subValue: `${stats?.invoices?.total || 0} total`,
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      title: 'Contactos CRM',
      value: stats?.crm?.contacts || 0,
      subValue: `${stats?.crm?.activeDeals || 0} oportunidades`,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r">
        <div className="flex items-center h-16 px-4 border-b">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Deep Seek
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                {item.active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </a>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold">Bem-vindo, {user?.name}! 👋</h2>
              <p className="text-blue-100 mt-2">Aqui está o resumo do seu negócio</p>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{card.subValue}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <button className="flex flex-col items-center p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Upload</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
              <Download className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Importar CSV</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
              <Wallet className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Pagamentos</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
              <Target className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Conciliação</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Activity className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user?.name} • {new Date(activity.createdAt).toLocaleString('pt-PT')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Sem atividade recente</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
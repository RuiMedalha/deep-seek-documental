'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import {
  FileText, TrendingUp, TrendingDown, Users, Target,
  Upload, Wallet, CheckCircle, AlertCircle,
  LogOut, Search, Bell, Zap, Building2,
  Calendar, Settings, Activity, Euro, Plus,
  Camera, ScanLine, Mail, FolderOpen, ArrowRight,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff,
  X, Check, ChevronDown, MoreVertical, Sparkles
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [statsRes, docsRes] = await Promise.all([
        api.get('/reports/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/documents/inbox', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data.documents || []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const token = localStorage.getItem('accessToken');
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('origin', 'UPLOAD');
      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setToast(`✅ ${file.name} carregado!`);
        setTimeout(() => setToast(''), 3000);
      } catch (error) {
        setToast(`❌ Erro ao carregar ${file.name}`);
      }
    }
    setUploading(false);
    loadData();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const monthlyData = [
    { name: 'Jan', receitas: 45000, despesas: 32000 },
    { name: 'Fev', receitas: 52000, despesas: 35000 },
    { name: 'Mar', receitas: 48000, despesas: 38000 },
    { name: 'Abr', receitas: 61000, despesas: 40000 },
    { name: 'Mai', receitas: 58000, despesas: 42000 },
    { name: 'Jun', receitas: 70000, despesas: 45000 },
    { name: 'Jul', receitas: 65000, despesas: 48000 },
    { name: 'Ago', receitas: 72000, despesas: 50000 },
  ];

  const categories = [
    { name: 'Fornecedores', value: 35, color: '#3B82F6' },
    { name: 'Salários', value: 25, color: '#8B5CF6' },
    { name: 'Impostos', value: 15, color: '#EF4444' },
    { name: 'Serviços', value: 12, color: '#F59E0B' },
    { name: 'Outros', value: 13, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-purple-900 text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="font-bold text-lg">Deep Seek</h1>
              <p className="text-xs text-blue-200">Documental</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Activity, label: 'Dashboard', active: true },
            { icon: FileText, label: 'Documentos', count: documents.length },
            { icon: Wallet, label: 'Financeiro' },
            { icon: Calendar, label: 'Calendário' },
            { icon: Target, label: 'Conciliação' },
            { icon: Users, label: 'CRM' },
            { icon: FolderOpen, label: 'Pastas' },
            { icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button key={item.label} className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${item.active ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
              {item.count !== undefined && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-blue-200">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1">
        {/* HEADER */}
        <header className="bg-white border-b px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Pesquisar..." className="pl-10 pr-4 py-2 border rounded-lg w-64 bg-gray-50 focus:bg-white" />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button onClick={() => setShowValues(!showValues)} className="p-2 text-gray-500 hover:text-gray-700">
              {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {/* TOAST */}
          {toast && (
            <div className="fixed top-20 right-8 z-50 bg-white shadow-2xl rounded-xl px-6 py-4 border">
              <p className="font-medium">{toast}</p>
            </div>
          )}

          {/* UPLOAD ZONE */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
                <p className="text-lg">A carregar...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto w-16 h-16 text-blue-500" />
                <p className="text-xl font-bold mt-4">Arraste documentos aqui</p>
                <p className="text-gray-500 mt-1">PDF, JPG, PNG, DOCX - ou clique para selecionar</p>
                <div className="flex justify-center gap-4 mt-4">
                  <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    <Camera className="w-4 h-4 mr-2" /> Foto
                  </span>
                  <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                    <ScanLine className="w-4 h-4 mr-2" /> Scanner
                  </span>
                  <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm">
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </span>
                </div>
              </>
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Documentos', value: stats?.documents?.total || 0, icon: FileText, gradient: 'from-blue-500 to-cyan-500' },
              { title: 'Receitas', value: showValues ? '€52,000' : '••••', icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' },
              { title: 'Despesas', value: showValues ? '€38,000' : '••••', icon: TrendingDown, gradient: 'from-red-500 to-pink-500' },
              { title: 'Contactos', value: stats?.crm?.contacts || 0, icon: Users, gradient: 'from-purple-500 to-violet-500' },
            ].map((card, i) => (
              <div key={i} className={`bg-gradient-to-r ${card.gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-shadow cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">{card.title}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <card.icon className="w-10 h-10 text-white/60" />
                </div>
              </div>
            ))}
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Fluxo de Caixa</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.6}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="receitas" stroke="#3B82F6" fill="url(#g1)" name="Receitas" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" stroke="#EF4444" fill="url(#g2)" name="Despesas" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Categorias</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                    {categories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DOCUMENTS LIST */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Documentos Recentes</h3>
            {documents.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Nenhum documento. Arraste ficheiros acima!</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">{doc.status} • {new Date(doc.createdAt).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
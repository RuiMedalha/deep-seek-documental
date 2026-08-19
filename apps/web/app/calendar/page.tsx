'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      const response = await api.get('/payments/calendar', {
        params: { month: currentMonth.toISOString() },
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar calendário:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthName = currentMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  const totalIncome = events
    .filter((e: any) => e.type === 'income')
    .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const totalExpense = events
    .filter((e: any) => e.type === 'expense')
    .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const overdue = events.filter((e: any) => e.isOverdue);
  const pending = events.filter((e: any) => !e.isPaid && !e.isOverdue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:pl-64">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Calendário Financeiro</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Receitas</p>
                <p className="text-xl font-bold text-green-600">€{totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <TrendingDown className="w-6 h-6 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Despesas</p>
                <p className="text-xl font-bold text-red-600">€{totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Em Atraso</p>
                <p className="text-xl font-bold text-orange-600">{overdue.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-xl font-bold text-blue-600">{pending.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow p-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold capitalize">{monthName}</h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold">Pagamentos do Mês</h3>
          </div>
          {events.length === 0 && !loading ? (
            <p className="text-center py-12 text-gray-500">Sem pagamentos este mês</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      event.isOverdue ? 'bg-red-100' : event.isPaid ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <CalendarIcon className={`w-5 h-5 ${
                        event.isOverdue ? 'text-red-600' : event.isPaid ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      event.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {event.type === 'income' ? '+' : '-'}€{Number(event.amount).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.isPaid ? 'bg-green-100 text-green-700' :
                      event.isOverdue ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.isPaid ? 'Pago' : event.isOverdue ? 'Em Atraso' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
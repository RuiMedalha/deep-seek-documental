'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  Target,
  Search,
  TrendingUp,
} from 'lucide-react';

export default function ReconciliationPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/reconciliation/suggestions');
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (transactionId: string, match: any) => {
    try {
      await api.post(`/reconciliation/${transactionId}/accept`, {
        entityId: match.entityId,
        entityType: match.entity,
      });
      loadSuggestions();
    } catch (error) {
      console.error('Erro ao aceitar:', error);
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      await api.post(`/reconciliation/${transactionId}/reject`);
      loadSuggestions();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  const getMatchColor = (type: string) => {
    switch (type) {
      case 'STRONG': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'WEAK': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:pl-64">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Conciliação Bancária</h1>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{suggestions.length}</p>
              <p className="text-sm text-gray-500">Sugestões pendentes</p>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        {suggestions.length === 0 && !loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Tudo conciliado! Sem sugestões pendentes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions.map((suggestion: any) => (
              <div key={suggestion.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold">{suggestion.transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(suggestion.transaction.date).toLocaleDateString('pt-PT')}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      €{Number(suggestion.transaction.amount).toLocaleString('pt-PT')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {suggestion.matches.length > 0 && (
                      <button
                        onClick={() => handleAccept(suggestion.transaction.id, suggestion.matches[0])}
                        className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aceitar
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(suggestion.transaction.id)}
                      className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </button>
                  </div>
                </div>

                {suggestion.matches.length > 0 && (
                  <div className="space-y-2">
                    {suggestion.matches.map((match: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${getMatchColor(match.type)}`}>
                            {match.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(match.confidence * 100)}% confiança
                          </span>
                        </div>
                        <p className="text-sm mt-2">{match.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
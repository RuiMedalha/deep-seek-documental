'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Target,
  Clock,
  Plus,
  Search,
  MoreVertical,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function CrmPage() {
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const [contactsRes, dealsRes] = await Promise.all([
        api.get('/crm/contacts', { params: { search } }),
        api.get('/crm/deals'),
      ]);
      setContacts(contactsRes.data.contacts);
      setDeals(dealsRes.data);
    } catch (error) {
      console.error('Erro ao carregar CRM:', error);
    } finally {
      setLoading(false);
    }
  };

  const pipelineStages = [
    { id: 'LEAD', name: 'Lead', color: 'bg-blue-500', deals: [] },
    { id: 'QUALIFIED', name: 'Qualificado', color: 'bg-purple-500', deals: [] },
    { id: 'PROPOSAL', name: 'Proposta', color: 'bg-yellow-500', deals: [] },
    { id: 'NEGOTIATION', name: 'Negociação', color: 'bg-orange-500', deals: [] },
    { id: 'WON', name: 'Ganho', color: 'bg-green-500', deals: [] },
  ];

  const dealsByStage = (stage: string) => deals.filter((d: any) => d.stage === stage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:pl-64">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">CRM</h1>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Contacto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-sm text-gray-500">Contactos</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <Building2 className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {contacts.filter((c: any) => c.type === 'COMPANY').length}
            </p>
            <p className="text-sm text-gray-500">Empresas</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <Target className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">
              {deals.filter((d: any) => d.stage !== 'LOST').length}
            </p>
            <p className="text-sm text-gray-500">Oportunidades</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <TrendingUp className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">
              {deals.filter((d: any) => d.stage === 'WON').length}
            </p>
            <p className="text-sm text-gray-500">Ganhos</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar contactos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((contact: any) => (
                <tr key={contact.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        contact.type === 'COMPANY' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {contact.type === 'COMPANY' ? (
                          <Building2 className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Users className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        {contact.nif && <p className="text-xs text-gray-500">NIF: {contact.nif}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">
                      {contact.type === 'COMPANY' ? 'Empresa' : 'Individual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {contact.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                        {contact.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contact.city && (
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {contact.city}, {contact.country}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pipeline */}
        <h2 className="text-xl font-bold mb-4">Pipeline de Vendas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="bg-white rounded-xl shadow p-4">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${stage.color} mb-3`}>
                {stage.name}
              </div>
              <div className="space-y-2">
                {dealsByStage(stage.id).map((deal: any) => (
                  <div key={deal.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{deal.title}</p>
                    <p className="text-xs text-gray-500">
                      €{Number(deal.value).toLocaleString('pt-PT')}
                    </p>
                  </div>
                ))}
                {dealsByStage(stage.id).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Sem oportunidades</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
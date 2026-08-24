'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [search, filter]);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents/inbox', {
        params: { search, status: filter === 'all' ? undefined : filter },
      });
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('origin', 'UPLOAD');

      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (error) {
        console.error('Erro no upload:', error);
      }
    }
    setUploading(false);
    loadDocuments();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  const getStatusBadge = (status: string) => {
    const config = {
      NOVO: { color: 'bg-blue-100 text-blue-700', label: 'Novo', icon: Clock },
      PROCESSADO: { color: 'bg-green-100 text-green-700', label: 'Processado', icon: CheckCircle },
      EM_REVISAO: { color: 'bg-yellow-100 text-yellow-700', label: 'Em Revisão', icon: AlertCircle },
      ARQUIVADO: { color: 'bg-gray-100 text-gray-700', label: 'Arquivado', icon: FileText },
    };
    const c = (config as any)[status] || config.NOVO;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:pl-64">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Documentos</h1>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`mb-8 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
              <span>A carregar...</span>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Arraste ficheiros aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, DOCX</p>
            </>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="NOVO">Novos</option>
              <option value="PROCESSADO">Processados</option>
              <option value="EM_REVISAO">Em Revisão</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ficheiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {doc.supplierCustomer || 'Sem fornecedor'} {doc.nif ? `• NIF: ${doc.nif}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{doc.type}</td>
                  <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documents.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum documento encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
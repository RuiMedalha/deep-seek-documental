'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  Download,
} from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [step, setStep] = useState(1);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);

      try {
        const response = await api.post('/bank-import/csv/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setParsedData(response.data);
        setMapping(response.data.autoDetected || {});
        setStep(2);
      } catch (error) {
        console.error('Erro ao processar CSV:', error);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const response = await api.post('/bank-import/csv/import', {
        fileHash: parsedData.fileHash,
        mapping,
      });
      setResult(response.data);
      setStep(3);
    } catch (error) {
      console.error('Erro na importação:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:pl-64">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Importar CSV Bancário</h1>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-16 w-16 text-gray-400" />
            <p className="mt-4 text-lg font-medium">Arraste o ficheiro CSV aqui</p>
            <p className="text-sm text-gray-500">ou clique para selecionar</p>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && parsedData && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-6">Configurar Mapeamento</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Coluna de Data</label>
                <select
                  value={mapping.dateColumn || ''}
                  onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {parsedData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Coluna de Descrição</label>
                <select
                  value={mapping.descriptionColumn || ''}
                  onChange={(e) => setMapping({ ...mapping, descriptionColumn: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {parsedData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Coluna de Valor</label>
                <select
                  value={mapping.amountColumn || ''}
                  onChange={(e) => setMapping({ ...mapping, amountColumn: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {parsedData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'A importar...' : 'Importar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Importação Concluída!</h2>
            <p className="text-gray-600">
              {result.imported} transações importadas com sucesso
            </p>
            {result.skipped > 0 && (
              <p className="text-yellow-600 mt-2">
                {result.skipped} transações ignoradas (duplicadas)
              </p>
            )}
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setParsedData(null);
                setResult(null);
              }}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Importar Outro Ficheiro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
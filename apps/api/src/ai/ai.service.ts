import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  private getAiProviders(): any[] {
    const providers = [];

    if (process.env.OPENAI_API_KEY) {
      providers.push({
        name: 'openai',
        type: 'api_key',
        url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      providers.push({
        name: 'anthropic',
        type: 'api_key',
        url: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      });
    }

    if (process.env.GEMINI_API_KEY) {
      providers.push({
        name: 'gemini',
        type: 'api_key',
        url: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      });
    }

    if (process.env.OLLAMA_URL) {
      providers.push({
        name: 'ollama',
        type: 'url',
        url: `${process.env.OLLAMA_URL}/api/chat`,
        model: process.env.OLLAMA_MODEL || 'llama3',
        headers: {},
      });
    }

    if (process.env.LM_STUDIO_URL) {
      providers.push({
        name: 'lmstudio',
        type: 'url',
        url: `${process.env.LM_STUDIO_URL}/v1/chat/completions`,
        model: process.env.LM_STUDIO_MODEL || 'local-model',
        headers: {},
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      providers.push({
        name: 'openrouter',
        type: 'api_key',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
      });
    }

    if (process.env.CUSTOM_AI_URL) {
      providers.push({
        name: 'custom',
        type: process.env.CUSTOM_AI_API_KEY ? 'api_key' : 'url',
        url: process.env.CUSTOM_AI_URL,
        model: process.env.CUSTOM_AI_MODEL || 'default',
        headers: process.env.CUSTOM_AI_API_KEY 
          ? { 'Authorization': `Bearer ${process.env.CUSTOM_AI_API_KEY}` }
          : {},
      });
    }

    return providers;
  }

  getConfiguredProviders() {
    return this.getAiProviders().map(p => ({
      provider: p.name,
      type: p.type,
      configured: true,
      model: p.model,
      url: p.url,
    }));
  }

  private async callAiProvider(providerName: string, prompt: string): Promise<any> {
    const providers = this.getAiProviders();
    
    if (providers.length === 0) {
      throw new Error('Nenhum provedor de IA configurado. Adicione OPENAI_API_KEY ou OLLAMA_URL na env.');
    }

    let provider = providers.find(p => p.name === providerName);
    
    if (!provider) {
      provider = providers[0];
    }

    try {
      let response;

      if (provider.name === 'anthropic') {
        response = await lastValueFrom(
          this.httpService.post(provider.url, {
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
          }, { headers: { ...provider.headers, 'Content-Type': 'application/json' } }),
        );
        return this.parseAiResponse(response.data.content?.[0]?.text || '');
      }

      if (provider.name === 'ollama') {
        response = await lastValueFrom(
          this.httpService.post(provider.url, {
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
          }, { headers: { 'Content-Type': 'application/json' } }),
        );
        return this.parseAiResponse(response.data.message?.content || '');
      }

      if (provider.name === 'gemini') {
        response = await lastValueFrom(
          this.httpService.post(provider.url, {
            contents: [{ parts: [{ text: prompt }] }],
          }, { headers: { ...provider.headers, 'Content-Type': 'application/json' } }),
        );
        return this.parseAiResponse(response.data.candidates?.[0]?.content?.parts?.[0]?.text || '');
      }

      response = await lastValueFrom(
        this.httpService.post(provider.url, {
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2000,
        }, { headers: { ...provider.headers, 'Content-Type': 'application/json' } }),
      );

      return this.parseAiResponse(response.data.choices?.[0]?.message?.content || '');

    } catch (error) {
      this.logger.error(`Erro ao chamar ${provider.name}:`, error.message);
      return null;
    }
  }

  private parseAiResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { text: content };
    } catch {
      return { text: content };
    }
  }

  async classifyDocumentWithAi(documentId: string, provider?: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new Error('Documento não encontrado');

    const prompt = `
      Analisa este documento fiscal português.
      Ficheiro: ${document.fileName}
      Texto: ${(document.metadata?.ocrText || '').substring(0, 3000)}
      Responde em JSON: { "type": "", "confidence": 0, "supplier": "", "nif": "", "total": 0, "category": "", "ivaDeductible": false }
    `;

    const result = await this.callAiProvider(provider || 'openai', prompt);

    if (result) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { metadata: { ...document.metadata, aiClassification: result } },
      });
    }

    return result;
  }

  async suggestFiscalCategory(supplierName: string, description: string, provider?: string) {
    const prompt = `Classifica fiscalmente: Fornecedor: ${supplierName}, Descrição: ${description}. Responde JSON: { "category": "", "ivaDeductible": false, "ivaRate": 0, "sncCode": "" }`;
    return this.callAiProvider(provider || 'openai', prompt);
  }

  async generateMonthlySummary(tenantId: string, month: Date, provider?: string) {
    const prompt = `Gera resumo financeiro para ${month.toLocaleDateString('pt-PT')}`;
    return this.callAiProvider(provider || 'openai', prompt);
  }
}
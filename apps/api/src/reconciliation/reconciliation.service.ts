import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async getSuggestions(tenantId: string) {
    // Buscar transações não conciliadas
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        tenantId,
        expenses: { none: {} },
        invoices: { none: {} },
      },
      take: 50,
      orderBy: { date: 'desc' },
    });

    const suggestions = [];

    for (const transaction of transactions) {
      const matches = await this.findMatches(tenantId, transaction);
      
      if (matches.length > 0) {
        suggestions.push({
          id: transaction.id,
          transaction: {
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            amount: Number(transaction.amount),
            reference: transaction.reference,
          },
          matches,
        });
      }
    }

    return suggestions;
  }

  private async findMatches(tenantId: string, transaction: any) {
    const matches = [];

    // Match forte: referência exata
    if (transaction.reference) {
      const expense = await this.prisma.expense.findFirst({
        where: {
          tenantId,
          description: { contains: transaction.reference },
          amount: Math.abs(Number(transaction.amount)),
          status: 'pendente',
        },
      });

      if (expense) {
        matches.push({
          type: 'STRONG',
          confidence: 0.95,
          entity: 'expense',
          entityId: expense.id,
          entityName: expense.description,
          explanation: `Referência exata: ${transaction.reference}`,
        });
      }

      const invoice = await this.prisma.invoice.findFirst({
        where: {
          tenantId,
          number: transaction.reference,
          amount: Math.abs(Number(transaction.amount)),
          status: 'pendente',
        },
      });

      if (invoice) {
        matches.push({
          type: 'STRONG',
          confidence: 0.95,
          entity: 'invoice',
          entityId: invoice.id,
          entityName: invoice.number,
          explanation: `Número de fatura: ${transaction.reference}`,
        });
      }
    }

    // Match fraco: valor + data
    if (matches.length === 0) {
      const dateWindow = 7;
      const txDate = new Date(transaction.date);
      const amount = Math.abs(Number(transaction.amount));

      const expenses = await this.prisma.expense.findMany({
        where: {
          tenantId,
          amount,
          date: {
            gte: new Date(txDate.getTime() - dateWindow * 24 * 60 * 60 * 1000),
            lte: new Date(txDate.getTime() + dateWindow * 24 * 60 * 60 * 1000),
          },
          status: 'pendente',
        },
        take: 3,
      });

      for (const expense of expenses) {
        const similarity = this.calculateSimilarity(
          transaction.description,
          expense.description,
        );

        if (similarity > 0.3) {
          matches.push({
            type: 'WEAK',
            confidence: similarity * 0.5,
            entity: 'expense',
            entityId: expense.id,
            entityName: expense.description,
            explanation: `Similaridade de ${(similarity * 100).toFixed(1)}%`,
          });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  async acceptSuggestion(tenantId: string, transactionId: string, entityId: string, entityType: string) {
    const transaction = await this.prisma.bankTransaction.findFirst({
      where: { id: transactionId, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (entityType === 'expense') {
      await this.prisma.expense.update({
        where: { id: entityId },
        data: {
          status: 'conciliado',
          bankTransactionId: transactionId,
        },
      });
    } else if (entityType === 'invoice') {
      await this.prisma.invoice.update({
        where: { id: entityId },
        data: {
          status: 'pago',
          bankTransactionId: transactionId,
        },
      });
    }

    return { success: true };
  }

  async rejectSuggestion(tenantId: string, transactionId: string) {
    return { success: true };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }
}
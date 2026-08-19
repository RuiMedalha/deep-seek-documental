import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportTransactionsToExcel(tenantId: string, filters?: any) {
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        tenantId,
        ...(filters?.startDate && { date: { gte: new Date(filters.startDate) } }),
        ...(filters?.endDate && { date: { lte: new Date(filters.endDate) } }),
      },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Deep Seek Documental';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Transações');

    worksheet.columns = [
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Descrição', key: 'description', width: 40 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Saldo', key: 'balance', width: 15 },
      { header: 'Referência', key: 'reference', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    transactions.forEach(tx => {
      worksheet.addRow({
        date: tx.date.toLocaleDateString('pt-PT'),
        description: tx.description,
        amount: Number(tx.amount).toFixed(2),
        balance: tx.balance ? Number(tx.balance).toFixed(2) : '',
        reference: tx.reference || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportInvoicesToExcel(tenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Faturas');

    worksheet.columns = [
      { header: 'Número', key: 'number', width: 20 },
      { header: 'Fornecedor', key: 'supplier', width: 30 },
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Vencimento', key: 'dueDate', width: 15 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };

    invoices.forEach(inv => {
      worksheet.addRow({
        number: inv.number,
        supplier: inv.supplier,
        date: inv.date.toLocaleDateString('pt-PT'),
        dueDate: inv.dueDate ? inv.dueDate.toLocaleDateString('pt-PT') : '',
        amount: Number(inv.amount).toFixed(2),
        status: inv.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
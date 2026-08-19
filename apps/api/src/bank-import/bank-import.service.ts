import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as csv from 'csv-parse';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class BankImportService {
  constructor(private prisma: PrismaService) {}

  async parseCsv(file: Express.Multer.File, tenantId: string) {
    if (!file) {
      throw new BadRequestException('Ficheiro CSV não fornecido');
    }

    const fileContent = fs.readFileSync(file.path, 'utf-8');
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

    const delimiter = this.detectDelimiter(fileContent);
    const records = await this.parseCsvContent(fileContent, delimiter);

    if (records.length === 0) {
      throw new BadRequestException('CSV vazio ou inválido');
    }

    const headers = records[0];
    const sampleRows = records.slice(1, 6);
    const autoDetected = this.autoDetectColumns(headers, sampleRows);

    return {
      fileHash,
      headers,
      sampleRows,
      totalRows: records.length - 1,
      autoDetected,
    };
  }

  async importCsv(tenantId: string, dto: any) {
    const existing = await this.prisma.bankTransaction.findFirst({
      where: { tenantId, fileHash: dto.fileHash },
    });

    if (existing) {
      throw new BadRequestException('Este ficheiro já foi importado');
    }

    const filePath = `/tmp/${dto.fileHash}.csv`;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const delimiter = this.detectDelimiter(fileContent);
    const records = await this.parseCsvContent(fileContent, delimiter);

    const transactions = [];
    const importBatch = crypto.randomUUID();

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      const mapping = dto.mapping;
      const headers = records[0];

      const getValue = (columnName) => {
        const index = headers.findIndex(h => h === columnName);
        return index >= 0 ? row[index] : null;
      };

      const dateStr = getValue(mapping.dateColumn);
      const date = this.parseDate(dateStr, mapping.dateFormat || 'DD/MM/YYYY');
      const description = getValue(mapping.descriptionColumn) || '';

      let amount = 0;
      if (mapping.amountColumn) {
        const amountStr = getValue(mapping.amountColumn);
        amount = this.parseAmount(amountStr, mapping.decimalSeparator || ',');
      } else if (mapping.debitColumn && mapping.creditColumn) {
        const debitStr = getValue(mapping.debitColumn);
        const creditStr = getValue(mapping.creditColumn);
        if (debitStr && debitStr.trim()) {
          amount = -this.parseAmount(debitStr, mapping.decimalSeparator || ',');
        } else if (creditStr && creditStr.trim()) {
          amount = this.parseAmount(creditStr, mapping.decimalSeparator || ',');
        }
      }

      const balanceStr = mapping.balanceColumn ? getValue(mapping.balanceColumn) : null;
      const balance = balanceStr ? this.parseAmount(balanceStr, mapping.decimalSeparator || ',') : null;
      const reference = mapping.referenceColumn ? getValue(mapping.referenceColumn) : null;

      const rawRowJson = {};
      headers.forEach((header, index) => {
        rawRowJson[header] = row[index];
      });

      transactions.push({
        tenantId,
        date,
        description,
        amount,
        balance,
        reference,
        rawRowJson,
        fileHash: dto.fileHash,
        importBatch,
      });
    }

    const result = await this.prisma.bankTransaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      batchId: importBatch,
      skipped: transactions.length - result.count,
    };
  }

  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    for (const delimiter of delimiters) {
      if (firstLine.includes(delimiter)) return delimiter;
    }
    return ',';
  }

  private parseCsvContent(content: string, delimiter: string): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      csv.parse(content, {
        delimiter,
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
  }

  private autoDetectColumns(headers: string[], sampleRows: string[][]) {
    const detection = {
      dateColumn: null,
      descriptionColumn: null,
      amountColumn: null,
      debitColumn: null,
      creditColumn: null,
      balanceColumn: null,
      referenceColumn: null,
    };

    headers.forEach((header) => {
      const h = header.toLowerCase();
      if (!detection.dateColumn && /data|date|dt/.test(h)) detection.dateColumn = header;
      if (!detection.descriptionColumn && /descri|historico|desc|memorial/.test(h)) detection.descriptionColumn = header;
      if (!detection.debitColumn && /d[eé]bito|debito|saida/.test(h)) detection.debitColumn = header;
      if (!detection.creditColumn && /cr[eé]dito|credito|entrada/.test(h)) detection.creditColumn = header;
      if (!detection.amountColumn && /valor|amount|montante/.test(h)) detection.amountColumn = header;
      if (!detection.balanceColumn && /saldo|balance/.test(h)) detection.balanceColumn = header;
      if (!detection.referenceColumn && /refer[eê]ncia|referencia|ref/.test(h)) detection.referenceColumn = header;
    });

    return detection;
  }

  private parseDate(dateStr: string, format: string): Date {
    const parts = dateStr.split(/[\/\-\.]/);
    if (format === 'DD/MM/YYYY') return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (format === 'MM/DD/YYYY') return new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    return new Date(dateStr);
  }

  private parseAmount(value: string, decimalSeparator: string): number {
    if (decimalSeparator === ',') {
      return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(value.replace(/,/g, ''));
  }
}
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Empresa Demo',
      slug: 'empresa-demo',
    },
  });

  console.log('✅ Tenant criado:', tenant.name);

  // Criar usuários
  const users = [
    { email: 'admin@example.com', password: 'Admin123!', name: 'Administrador', role: 'ADMIN' },
    { email: 'operador@example.com', password: 'Operador123!', name: 'Operador', role: 'OPERADOR' },
    { email: 'contabilista@example.com', password: 'Contab123!', name: 'Contabilista', role: 'CONTABILIDADE' },
    { email: 'aprovador@example.com', password: 'Aprov123!', name: 'Aprovador', role: 'APROVADOR' },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role as any,
        tenantId: tenant.id,
        canViewBankValues: ['ADMIN', 'CONTABILIDADE'].includes(userData.role),
        canViewReconciliation: ['ADMIN', 'CONTABILIDADE', 'APROVADOR'].includes(userData.role),
        canApprovePayments: ['ADMIN', 'CONTABILIDADE', 'APROVADOR'].includes(userData.role),
        canExportData: ['ADMIN', 'CONTABILIDADE'].includes(userData.role),
      },
    });
  }

  console.log('✅ Usuários criados');

  // Criar pipeline padrão
  await prisma.crmPipeline.create({
    data: {
      tenantId: tenant.id,
      name: 'Pipeline Padrão',
      isDefault: true,
      stages: [
        { id: 'LEAD', name: 'Lead', color: '#3B82F6' },
        { id: 'QUALIFIED', name: 'Qualificado', color: '#8B5CF6' },
        { id: 'PROPOSAL', name: 'Proposta', color: '#F59E0B' },
        { id: 'NEGOTIATION', name: 'Negociação', color: '#EF4444' },
        { id: 'WON', name: 'Ganho', color: '#10B981' },
        { id: 'LOST', name: 'Perdido', color: '#6B7280' },
      ],
    },
  });

  console.log('✅ Pipeline criado');

  // Criar pasta padrão
  await prisma.folder.create({
    data: {
      tenantId: tenant.id,
      name: 'Documentos Gerais',
      pattern: '/{Ano}/{Mes}/{Tipo}/{Entidade}',
      rules: {},
    },
  });

  console.log('✅ Pasta criada');

  // Criar contactos demo
  const contato1 = await prisma.crmContact.create({
    data: {
      tenantId: tenant.id,
      type: 'COMPANY',
      name: 'Fornecedor Demo Lda',
      nif: '500000001',
      email: 'fornecedor@demo.pt',
      phone: '+351 210 000 001',
      city: 'Lisboa',
      country: 'Portugal',
      tags: ['fornecedor', 'demo'],
    },
  });

  const contato2 = await prisma.crmContact.create({
    data: {
      tenantId: tenant.id,
      type: 'COMPANY',
      name: 'Cliente Demo SA',
      nif: '510000002',
      email: 'cliente@demo.pt',
      phone: '+351 220 000 002',
      city: 'Porto',
      country: 'Portugal',
      tags: ['cliente', 'demo'],
    },
  });

  console.log('✅ Contactos CRM criados');

  // Criar fatura demo
  await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      number: 'FT 2024/001',
      supplier: 'Fornecedor Demo Lda',
      amount: 1250.00,
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      status: 'pendente',
    },
  });

  // Criar despesa demo
  await prisma.expense.create({
    data: {
      tenantId: tenant.id,
      description: 'Material de escritório',
      amount: 350.75,
      date: new Date('2024-01-20'),
      category: 'Escritório',
      status: 'pendente',
    },
  });

  console.log('✅ Fatura e despesa criadas');

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📧 Credenciais de acesso:');
  console.log('   Admin: admin@example.com / Admin123!');
  console.log('   Operador: operador@example.com / Operador123!');
  console.log('   Contabilista: contabilista@example.com / Contab123!');
  console.log('   Aprovador: aprovador@example.com / Aprov123!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
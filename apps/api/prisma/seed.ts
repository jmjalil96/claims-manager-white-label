import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import cuid from 'cuid'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

// ============================================================================
// ID GENERATORS
// ============================================================================

const ids = {
  // Users
  userSuperadmin: cuid(),
  userEmployee: cuid(),

  // Clients
  clientAcme: cuid(),
  clientGlobal: cuid(),

  // Insurers
  insurerNational: cuid(),
  insurerPremier: cuid(),

  // Policies
  policyAcme1: cuid(),
  policyAcme2: cuid(),
  policyGlobal1: cuid(),
  policyGlobal2: cuid(),

  // Families
  familyAcme1: cuid(),
  familyAcme2: cuid(),
  familyGlobal1: cuid(),
  familyGlobal2: cuid(),

  // Affiliates (Acme)
  affAcme1Owner: cuid(),
  affAcme1Dep1: cuid(),
  affAcme1Dep2: cuid(),
  affAcme2Owner: cuid(),
  affAcme2Dep1: cuid(),

  // Affiliates (Global)
  affGlobal1Owner: cuid(),
  affGlobal1Dep1: cuid(),
  affGlobal1Dep2: cuid(),
  affGlobal1Dep3: cuid(),
  affGlobal2Owner: cuid(),
  affGlobal2Dep1: cuid(),
  affGlobal2Dep2: cuid(),
}

// ============================================================================
// SEED DATA
// ============================================================================

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (in reverse dependency order)
  console.log('🧹 Cleaning existing data...')
  await db.claimReprocess.deleteMany()
  await db.claimInvoice.deleteMany()
  await db.claim.deleteMany()
  await db.policyAffiliate.deleteMany()
  await db.affiliate.deleteMany()
  await db.family.deleteMany()
  await db.policy.deleteMany()
  await db.insurer.deleteMany()
  await db.userClient.deleteMany()
  await db.session.deleteMany()
  await db.account.deleteMany()
  await db.client.deleteMany()
  await db.employee.deleteMany()
  await db.user.deleteMany()

  // -------------------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------------------
  console.log('👤 Creating users...')

  await db.user.createMany({
    data: [
      {
        id: ids.userSuperadmin,
        email: 'admin@claims.local',
        emailVerified: true,
        name: 'Admin User',
        role: 'superadmin',
      },
      {
        id: ids.userEmployee,
        email: 'employee@claims.local',
        emailVerified: true,
        name: 'Claims Employee',
        role: 'claims_employee',
      },
    ],
  })

  // Create accounts with password "password123" (bcrypt hash)
  const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.e4z8e1DKcGJTHqkKQRPUGP.fNKzJSy'
  await db.account.createMany({
    data: [
      {
        id: cuid(),
        userId: ids.userSuperadmin,
        accountId: ids.userSuperadmin,
        providerId: 'credential',
        password: passwordHash,
      },
      {
        id: cuid(),
        userId: ids.userEmployee,
        accountId: ids.userEmployee,
        providerId: 'credential',
        password: passwordHash,
      },
    ],
  })

  // -------------------------------------------------------------------------
  // CLIENTS
  // -------------------------------------------------------------------------
  console.log('🏢 Creating clients...')

  await db.client.createMany({
    data: [
      {
        id: ids.clientAcme,
        name: 'Acme Corporation',
        taxId: 'ACM-123456',
        email: 'rrhh@acme.com',
        phone: '+502 2222-1111',
        address: '10 Calle 5-20, Zona 10, Guatemala',
        isActive: true,
      },
      {
        id: ids.clientGlobal,
        name: 'Global Industries',
        taxId: 'GLB-789012',
        email: 'admin@globalind.com',
        phone: '+502 2222-2222',
        address: 'Blvd. Los Próceres 15-80, Zona 14, Guatemala',
        isActive: true,
      },
    ],
  })

  // Link users to clients
  await db.userClient.createMany({
    data: [
      { userId: ids.userSuperadmin, clientId: ids.clientAcme },
      { userId: ids.userSuperadmin, clientId: ids.clientGlobal },
      { userId: ids.userEmployee, clientId: ids.clientAcme },
      { userId: ids.userEmployee, clientId: ids.clientGlobal },
    ],
  })

  // -------------------------------------------------------------------------
  // INSURERS
  // -------------------------------------------------------------------------
  console.log('🏛️ Creating insurers...')

  await db.insurer.createMany({
    data: [
      {
        id: ids.insurerNational,
        name: 'Seguros Nacional',
        code: 'SNAT',
        email: 'servicios@segurosnacional.gt',
        phone: '+502 2300-0000',
        website: 'https://segurosnacional.gt',
        isActive: true,
      },
      {
        id: ids.insurerPremier,
        name: 'Premier Insurance',
        code: 'PREM',
        email: 'claims@premierins.gt',
        phone: '+502 2400-0000',
        website: 'https://premierins.gt',
        isActive: true,
      },
    ],
  })

  // -------------------------------------------------------------------------
  // POLICIES
  // -------------------------------------------------------------------------
  console.log('📋 Creating policies...')

  const policyStartDate = new Date('2024-01-01')
  const policyEndDate = new Date('2024-12-31')

  await db.policy.createMany({
    data: [
      {
        id: ids.policyAcme1,
        policyNumber: 'POL-ACME-2024-001',
        clientId: ids.clientAcme,
        insurerId: ids.insurerNational,
        type: 'HEALTH',
        status: 'ACTIVE',
        startDate: policyStartDate,
        endDate: policyEndDate,
        ambCopay: 100,
        hospCopay: 500,
        maternity: 2500,
        tPremium: 450,
        tplus1Premium: 650,
        tplusfPremium: 850,
        isActive: true,
      },
      {
        id: ids.policyAcme2,
        policyNumber: 'POL-ACME-2024-002',
        clientId: ids.clientAcme,
        insurerId: ids.insurerPremier,
        type: 'DENTAL',
        status: 'ACTIVE',
        startDate: policyStartDate,
        endDate: policyEndDate,
        ambCopay: 50,
        hospCopay: 250,
        maternity: 1500,
        tPremium: 650,
        tplus1Premium: 950,
        tplusfPremium: 1150,
        isActive: true,
      },
      {
        id: ids.policyGlobal1,
        policyNumber: 'POL-GLOBAL-2024-001',
        clientId: ids.clientGlobal,
        insurerId: ids.insurerNational,
        type: 'HEALTH',
        status: 'ACTIVE',
        startDate: policyStartDate,
        endDate: policyEndDate,
        ambCopay: 75,
        hospCopay: 400,
        maternity: 2000,
        tPremium: 500,
        tplus1Premium: 700,
        tplusfPremium: 900,
        isActive: true,
      },
      {
        id: ids.policyGlobal2,
        policyNumber: 'POL-GLOBAL-2024-002',
        clientId: ids.clientGlobal,
        insurerId: ids.insurerPremier,
        type: 'DENTAL',
        status: 'ACTIVE',
        startDate: policyStartDate,
        endDate: policyEndDate,
        ambCopay: 25,
        hospCopay: 200,
        maternity: 1000,
        tPremium: 700,
        tplus1Premium: 1000,
        tplusfPremium: 1300,
        isActive: true,
      },
    ],
  })

  // -------------------------------------------------------------------------
  // FAMILIES
  // -------------------------------------------------------------------------
  console.log('👨‍👩‍👧‍👦 Creating families...')

  await db.family.createMany({
    data: [
      { id: ids.familyAcme1, clientId: ids.clientAcme },
      { id: ids.familyAcme2, clientId: ids.clientAcme },
      { id: ids.familyGlobal1, clientId: ids.clientGlobal },
      { id: ids.familyGlobal2, clientId: ids.clientGlobal },
    ],
  })

  // -------------------------------------------------------------------------
  // AFFILIATES
  // -------------------------------------------------------------------------
  console.log('👥 Creating affiliates...')

  // Acme Family 1
  await db.affiliate.create({
    data: {
      id: ids.affAcme1Owner,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@acme.com',
      phone: '+502 5555-0001',
      dateOfBirth: new Date('1985-03-15'),
      documentType: 'DPI',
      documentNumber: '1234567890101',
      affiliateType: 'OWNER',
      coverageType: 'TPLUSF',
      clientId: ids.clientAcme,
      familyId: ids.familyAcme1,
    },
  })

  await db.affiliate.createMany({
    data: [
      {
        id: ids.affAcme1Dep1,
        firstName: 'María',
        lastName: 'Mendoza',
        email: 'maria.mendoza@gmail.com',
        phone: '+502 5555-0002',
        dateOfBirth: new Date('1987-07-22'),
        documentType: 'DPI',
        documentNumber: '1234567890102',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUSF',
        clientId: ids.clientAcme,
        familyId: ids.familyAcme1,
        primaryAffiliateId: ids.affAcme1Owner,
      },
      {
        id: ids.affAcme1Dep2,
        firstName: 'Sofía',
        lastName: 'Mendoza',
        dateOfBirth: new Date('2015-11-08'),
        documentType: 'MENOR',
        documentNumber: 'M-2015-001',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUSF',
        clientId: ids.clientAcme,
        familyId: ids.familyAcme1,
        primaryAffiliateId: ids.affAcme1Owner,
      },
    ],
  })

  // Acme Family 2
  await db.affiliate.create({
    data: {
      id: ids.affAcme2Owner,
      firstName: 'Roberto',
      lastName: 'García',
      email: 'roberto.garcia@acme.com',
      phone: '+502 5555-0010',
      dateOfBirth: new Date('1980-01-20'),
      documentType: 'DPI',
      documentNumber: '2345678901201',
      affiliateType: 'OWNER',
      coverageType: 'T',
      clientId: ids.clientAcme,
      familyId: ids.familyAcme2,
    },
  })

  await db.affiliate.create({
    data: {
      id: ids.affAcme2Dep1,
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana.garcia@gmail.com',
      phone: '+502 5555-0011',
      dateOfBirth: new Date('1982-05-14'),
      documentType: 'DPI',
      documentNumber: '2345678901202',
      affiliateType: 'DEPENDENT',
      coverageType: 'T',
      clientId: ids.clientAcme,
      familyId: ids.familyAcme2,
      primaryAffiliateId: ids.affAcme2Owner,
    },
  })

  // Global Family 1 (larger family)
  await db.affiliate.create({
    data: {
      id: ids.affGlobal1Owner,
      firstName: 'Luis',
      lastName: 'Hernández',
      email: 'luis.hernandez@globalind.com',
      phone: '+502 5555-0020',
      dateOfBirth: new Date('1978-09-03'),
      documentType: 'DPI',
      documentNumber: '3456789012301',
      affiliateType: 'OWNER',
      coverageType: 'TPLUSF',
      clientId: ids.clientGlobal,
      familyId: ids.familyGlobal1,
    },
  })

  await db.affiliate.createMany({
    data: [
      {
        id: ids.affGlobal1Dep1,
        firstName: 'Carmen',
        lastName: 'Hernández',
        email: 'carmen.hernandez@gmail.com',
        phone: '+502 5555-0021',
        dateOfBirth: new Date('1980-12-18'),
        documentType: 'DPI',
        documentNumber: '3456789012302',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUSF',
        clientId: ids.clientGlobal,
        familyId: ids.familyGlobal1,
        primaryAffiliateId: ids.affGlobal1Owner,
      },
      {
        id: ids.affGlobal1Dep2,
        firstName: 'Diego',
        lastName: 'Hernández',
        dateOfBirth: new Date('2008-04-25'),
        documentType: 'MENOR',
        documentNumber: 'M-2008-001',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUSF',
        clientId: ids.clientGlobal,
        familyId: ids.familyGlobal1,
        primaryAffiliateId: ids.affGlobal1Owner,
      },
      {
        id: ids.affGlobal1Dep3,
        firstName: 'Valentina',
        lastName: 'Hernández',
        dateOfBirth: new Date('2012-08-10'),
        documentType: 'MENOR',
        documentNumber: 'M-2012-001',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUSF',
        clientId: ids.clientGlobal,
        familyId: ids.familyGlobal1,
        primaryAffiliateId: ids.affGlobal1Owner,
      },
    ],
  })

  // Global Family 2
  await db.affiliate.create({
    data: {
      id: ids.affGlobal2Owner,
      firstName: 'Patricia',
      lastName: 'López',
      email: 'patricia.lopez@globalind.com',
      phone: '+502 5555-0030',
      dateOfBirth: new Date('1990-06-30'),
      documentType: 'DPI',
      documentNumber: '4567890123401',
      affiliateType: 'OWNER',
      coverageType: 'TPLUS1',
      clientId: ids.clientGlobal,
      familyId: ids.familyGlobal2,
    },
  })

  await db.affiliate.createMany({
    data: [
      {
        id: ids.affGlobal2Dep1,
        firstName: 'Fernando',
        lastName: 'López',
        email: 'fernando.lopez@gmail.com',
        phone: '+502 5555-0031',
        dateOfBirth: new Date('1988-02-14'),
        documentType: 'DPI',
        documentNumber: '4567890123402',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUS1',
        clientId: ids.clientGlobal,
        familyId: ids.familyGlobal2,
        primaryAffiliateId: ids.affGlobal2Owner,
      },
      {
        id: ids.affGlobal2Dep2,
        firstName: 'Emma',
        lastName: 'López',
        dateOfBirth: new Date('2018-01-05'),
        documentType: 'MENOR',
        documentNumber: 'M-2018-001',
        affiliateType: 'DEPENDENT',
        coverageType: 'TPLUS1',
        clientId: ids.clientGlobal,
        familyId: ids.familyGlobal2,
        primaryAffiliateId: ids.affGlobal2Owner,
      },
    ],
  })

  // -------------------------------------------------------------------------
  // POLICY AFFILIATES
  // -------------------------------------------------------------------------
  console.log('🔗 Linking affiliates to policies...')

  await db.policyAffiliate.createMany({
    data: [
      // Acme affiliates to policies
      { policyId: ids.policyAcme1, affiliateId: ids.affAcme1Owner },
      { policyId: ids.policyAcme1, affiliateId: ids.affAcme1Dep1 },
      { policyId: ids.policyAcme1, affiliateId: ids.affAcme1Dep2 },
      { policyId: ids.policyAcme2, affiliateId: ids.affAcme2Owner },
      { policyId: ids.policyAcme2, affiliateId: ids.affAcme2Dep1 },

      // Global affiliates to policies
      { policyId: ids.policyGlobal1, affiliateId: ids.affGlobal1Owner },
      { policyId: ids.policyGlobal1, affiliateId: ids.affGlobal1Dep1 },
      { policyId: ids.policyGlobal1, affiliateId: ids.affGlobal1Dep2 },
      { policyId: ids.policyGlobal1, affiliateId: ids.affGlobal1Dep3 },
      { policyId: ids.policyGlobal2, affiliateId: ids.affGlobal2Owner },
      { policyId: ids.policyGlobal2, affiliateId: ids.affGlobal2Dep1 },
      { policyId: ids.policyGlobal2, affiliateId: ids.affGlobal2Dep2 },
    ],
  })

  // -------------------------------------------------------------------------
  // CLAIMS
  // -------------------------------------------------------------------------
  console.log('📝 Creating claims...')

  let claimSeq = 1
  const claims = [
    // DRAFT claims (missing some required fields intentionally)
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Owner,
      policyId: ids.policyAcme1,
      status: 'DRAFT' as const,
      description: 'Consulta médica general - pendiente completar',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z00.0',
      diagnosisDescription: 'Examen médico general',
      incidentDate: new Date('2024-11-01'),
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Dep2,
      policyId: ids.policyAcme1,
      status: 'DRAFT' as const,
      description: 'Pediatría - control de niño sano',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z00.1',
      diagnosisDescription: 'Control de rutina del niño',
      incidentDate: new Date('2024-11-05'),
      createdById: ids.userEmployee,
    },

    // VALIDATION claims (ready for validation)
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal1Owner,
      patientId: ids.affGlobal1Dep1,
      policyId: ids.policyGlobal1,
      status: 'VALIDATION' as const,
      description: 'Consulta ginecológica de rutina',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z01.4',
      diagnosisDescription: 'Examen ginecológico (general)',
      incidentDate: new Date('2024-10-20'),
      amountSubmitted: 850.0,
      submittedDate: new Date('2024-10-25'),
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme2Owner,
      patientId: ids.affAcme2Owner,
      policyId: ids.policyAcme2,
      status: 'VALIDATION' as const,
      description: 'Exámenes de laboratorio - perfil lipídico',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z13.6',
      diagnosisDescription: 'Examen de pesquisa de enfermedades cardiovasculares',
      incidentDate: new Date('2024-10-15'),
      amountSubmitted: 450.0,
      submittedDate: new Date('2024-10-18'),
      createdById: ids.userEmployee,
    },

    // SUBMITTED claims
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal1Owner,
      patientId: ids.affGlobal1Owner,
      policyId: ids.policyGlobal1,
      status: 'SUBMITTED' as const,
      description: 'Consulta cardiología y electrocardiograma',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'I10',
      diagnosisDescription: 'Hipertensión esencial (primaria)',
      incidentDate: new Date('2024-10-01'),
      amountSubmitted: 1200.0,
      submittedDate: new Date('2024-10-05'),
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Dep1,
      policyId: ids.policyAcme1,
      status: 'SUBMITTED' as const,
      description: 'Consulta dermatología',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'L30.9',
      diagnosisDescription: 'Dermatitis, no especificada',
      incidentDate: new Date('2024-09-28'),
      amountSubmitted: 600.0,
      submittedDate: new Date('2024-10-02'),
      createdById: ids.userEmployee,
    },

    // PENDING_INFO claims
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal2Owner,
      patientId: ids.affGlobal2Owner,
      policyId: ids.policyGlobal2,
      status: 'PENDING_INFO' as const,
      description: 'Hospitalización por procedimiento quirúrgico',
      careType: 'HOSPITALIZATION' as const,
      diagnosisCode: 'K80.2',
      diagnosisDescription: 'Cálculo de la vesícula biliar sin colecistitis',
      incidentDate: new Date('2024-09-15'),
      amountSubmitted: 25000.0,
      submittedDate: new Date('2024-09-20'),
      pendingReason: 'Se requiere copia del epicrisis y factura detallada del hospital',
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Owner,
      policyId: ids.policyAcme1,
      status: 'PENDING_INFO' as const,
      description: 'Resonancia magnética de rodilla',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'M23.2',
      diagnosisDescription: 'Trastorno del menisco debido a desgarro o lesión antigua',
      incidentDate: new Date('2024-09-10'),
      amountSubmitted: 3500.0,
      submittedDate: new Date('2024-09-12'),
      pendingReason: 'Falta orden médica con justificación del estudio',
      createdById: ids.userEmployee,
    },

    // RETURNED claims
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal1Owner,
      patientId: ids.affGlobal1Dep2,
      policyId: ids.policyGlobal1,
      status: 'RETURNED' as const,
      description: 'Consulta oftalmología pediátrica',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'H52.1',
      diagnosisDescription: 'Miopía',
      incidentDate: new Date('2024-08-20'),
      amountSubmitted: 500.0,
      submittedDate: new Date('2024-08-25'),
      returnReason: 'Documentación incompleta. La factura no corresponde al proveedor autorizado.',
      createdById: ids.userEmployee,
    },

    // SETTLED claims (complete workflow)
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme2Owner,
      patientId: ids.affAcme2Dep1,
      policyId: ids.policyAcme2,
      status: 'SETTLED' as const,
      description: 'Consulta médica general y medicamentos',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'J06.9',
      diagnosisDescription: 'Infección aguda de las vías respiratorias superiores, no especificada',
      incidentDate: new Date('2024-08-01'),
      amountSubmitted: 750.0,
      submittedDate: new Date('2024-08-03'),
      amountApproved: 650.0,
      amountDenied: 0,
      amountUnprocessed: 0,
      deductibleApplied: 50.0,
      copayApplied: 50.0,
      settlementDate: new Date('2024-08-15'),
      settlementNumber: 'LIQ-2024-0001',
      settlementNotes: 'Aprobado según cobertura. Deducible y copago aplicados.',
      businessDays: 8,
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal1Owner,
      patientId: ids.affGlobal1Dep3,
      policyId: ids.policyGlobal1,
      status: 'SETTLED' as const,
      description: 'Urgencia pediátrica - gastroenteritis',
      careType: 'EMERGENCY' as const,
      diagnosisCode: 'A09',
      diagnosisDescription: 'Diarrea y gastroenteritis de presunto origen infeccioso',
      incidentDate: new Date('2024-07-20'),
      amountSubmitted: 1800.0,
      submittedDate: new Date('2024-07-22'),
      amountApproved: 1500.0,
      amountDenied: 100.0,
      amountUnprocessed: 0,
      deductibleApplied: 100.0,
      copayApplied: 100.0,
      settlementDate: new Date('2024-08-05'),
      settlementNumber: 'LIQ-2024-0002',
      settlementNotes: 'Medicamentos no incluidos en cuadro básico denegados.',
      businessDays: 10,
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Dep1,
      policyId: ids.policyAcme1,
      status: 'SETTLED' as const,
      description: 'Parto normal - maternidad',
      careType: 'MATERNITY' as const,
      diagnosisCode: 'O80',
      diagnosisDescription: 'Parto único espontáneo',
      incidentDate: new Date('2024-06-15'),
      amountSubmitted: 35000.0,
      submittedDate: new Date('2024-06-20'),
      amountApproved: 32000.0,
      amountDenied: 500.0,
      amountUnprocessed: 0,
      deductibleApplied: 0,
      copayApplied: 2500.0,
      settlementDate: new Date('2024-07-10'),
      settlementNumber: 'LIQ-2024-0003',
      settlementNotes: 'Cobertura de maternidad aplicada. Habitación privada denegada por exceso de días.',
      businessDays: 14,
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal2Owner,
      patientId: ids.affGlobal2Dep1,
      policyId: ids.policyGlobal2,
      status: 'SETTLED' as const,
      description: 'Cirugía ambulatoria - hernia inguinal',
      careType: 'HOSPITALIZATION' as const,
      diagnosisCode: 'K40.9',
      diagnosisDescription: 'Hernia inguinal unilateral o no especificada, sin obstrucción ni gangrena',
      incidentDate: new Date('2024-05-10'),
      amountSubmitted: 18000.0,
      submittedDate: new Date('2024-05-15'),
      amountApproved: 16500.0,
      amountDenied: 1000.0,
      amountUnprocessed: 0,
      deductibleApplied: 200.0,
      copayApplied: 300.0,
      settlementDate: new Date('2024-06-01'),
      settlementNumber: 'LIQ-2024-0004',
      settlementNotes: 'Procedimiento aprobado. Insumos no autorizados denegados.',
      businessDays: 12,
      createdById: ids.userEmployee,
    },

    // CANCELLED claim
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme2Owner,
      patientId: ids.affAcme2Owner,
      policyId: ids.policyAcme2,
      status: 'CANCELLED' as const,
      description: 'Consulta duplicada - cancelada',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z00.0',
      diagnosisDescription: 'Examen médico general',
      incidentDate: new Date('2024-07-01'),
      amountSubmitted: 400.0,
      submittedDate: new Date('2024-07-05'),
      cancellationReason: 'Reclamo duplicado. Ya existe reclamo REC-2024-00010 para el mismo servicio.',
      createdById: ids.userEmployee,
    },

    // More DRAFT claims for testing
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal2Owner,
      patientId: ids.affGlobal2Dep2,
      policyId: ids.policyGlobal2,
      status: 'DRAFT' as const,
      description: 'Vacunación infantil',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z23',
      diagnosisDescription: 'Necesidad de inmunización contra enfermedad bacteriana única',
      incidentDate: new Date('2024-11-10'),
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme1Owner,
      patientId: ids.affAcme1Owner,
      policyId: ids.policyAcme1,
      status: 'DRAFT' as const,
      description: 'Terapia física - 10 sesiones',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'M54.5',
      diagnosisDescription: 'Lumbago no especificado',
      incidentDate: new Date('2024-11-08'),
      createdById: ids.userEmployee,
    },

    // More SUBMITTED for testing kanban
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientGlobal,
      affiliateId: ids.affGlobal1Owner,
      patientId: ids.affGlobal1Dep1,
      policyId: ids.policyGlobal1,
      status: 'SUBMITTED' as const,
      description: 'Chequeo ejecutivo completo',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'Z00.0',
      diagnosisDescription: 'Examen médico general',
      incidentDate: new Date('2024-10-25'),
      amountSubmitted: 2500.0,
      submittedDate: new Date('2024-10-28'),
      createdById: ids.userEmployee,
    },
    {
      id: cuid(),
      claimNumber: `REC-2024-${String(claimSeq++).padStart(5, '0')}`,
      clientId: ids.clientAcme,
      affiliateId: ids.affAcme2Owner,
      patientId: ids.affAcme2Dep1,
      policyId: ids.policyAcme2,
      status: 'SUBMITTED' as const,
      description: 'Consulta odontológica y limpieza',
      careType: 'AMBULATORY' as const,
      diagnosisCode: 'K02.9',
      diagnosisDescription: 'Caries dental, no especificada',
      incidentDate: new Date('2024-10-22'),
      amountSubmitted: 350.0,
      submittedDate: new Date('2024-10-24'),
      createdById: ids.userEmployee,
    },
  ]

  for (const claim of claims) {
    await db.claim.create({ data: claim })
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  const counts = {
    users: await db.user.count(),
    clients: await db.client.count(),
    insurers: await db.insurer.count(),
    policies: await db.policy.count(),
    families: await db.family.count(),
    affiliates: await db.affiliate.count(),
    policyAffiliates: await db.policyAffiliate.count(),
    claims: await db.claim.count(),
  }

  console.log('\n✅ Seed complete!')
  console.log('📊 Summary:')
  console.log(`   - Users: ${counts.users}`)
  console.log(`   - Clients: ${counts.clients}`)
  console.log(`   - Insurers: ${counts.insurers}`)
  console.log(`   - Policies: ${counts.policies}`)
  console.log(`   - Families: ${counts.families}`)
  console.log(`   - Affiliates: ${counts.affiliates}`)
  console.log(`   - PolicyAffiliates: ${counts.policyAffiliates}`)
  console.log(`   - Claims: ${counts.claims}`)
  console.log('\n🔐 Login credentials:')
  console.log('   - admin@claims.local / password123')
  console.log('   - employee@claims.local / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    await pool.end()
  })

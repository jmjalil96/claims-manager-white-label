# Affiliate Enrollment System Design

## Overview

This document outlines the design for managing affiliates (policyholders and their dependents) and their enrollment in insurance policies.

## Key Concepts

- **Affiliate**: A person covered by insurance (either an owner/titular or a dependent)
- **Owner/Titular**: The primary policyholder who can enroll in policies
- **Dependent**: A family member covered under the owner's policy (spouse, child, etc.)
- **PolicyEnrollment**: Links an owner to a policy with a coverage tier
- **EnrollmentDependent**: Tracks which dependents are covered under an owner's enrollment

## Design Principles

1. **Single source of truth**: Only owners have enrollments; dependents are linked via `EnrollmentDependent`
2. **No drift**: Dependent coverage dates are tracked separately from the enrollment itself
3. **Tier enforcement**: Coverage type (T, TPLUS1, TPLUSF) determines how many dependents are allowed
4. **Audit trail**: Full history of when dependents were added/removed
5. **Atomic creation**: Affiliate + Enrollment + Dependents created in single transaction

---

## Module Structure

### API Feature Organization

```
apps/api/src/features/
├── affiliates/              # Affiliate CRUD (Client-owned)
│   ├── createAffiliate      # Standalone affiliate creation (rare)
│   ├── updateAffiliate
│   ├── listAffiliates       # By client
│   └── getAffiliate
│
├── enrollments/             # Enrollment operations (main entry point)
│   ├── enrollAffiliate      # Creates affiliate + enrollment + dependents atomically
│   ├── bulkEnroll           # Excel import
│   ├── unenroll             # Sets endDate on enrollment
│   ├── addDependent         # Add to existing enrollment
│   ├── removeDependent      # Sets removedAt on EnrollmentDependent
│   ├── updateEnrollment     # Change tier, dates, etc.
│   └── listEnrollments      # By policy or by affiliate
│
└── policies/                # Existing policy module
    └── ...
```

### Key Insight

`enrollAffiliate` is the **main entry point** for creating affiliates. It handles both affiliate creation and enrollment atomically. Standalone affiliate creation exists but is rarely used directly.

---

## UX Design

### Entry Points

Users can enroll affiliates from two places, both using the same atomic operation:

#### 1. From Policy (Primary)

```
┌─────────────────────────────────────────────────┐
│ Policy: POL-001 (Health - Acme Corp)            │
├─────────────────────────────────────────────────┤
│ [+ Enroll New]  [📥 Import Excel]               │
│                                                 │
│ Enrolled Affiliates (12)                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Juan Pérez (T+F) - 3 dependents             │ │
│ │ Ana García (T) - no dependents              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Flow:** Policy Detail → "Enroll New" → Form creates affiliate + enrollment atomically

#### 2. From Client (Secondary)

```
┌─────────────────────────────────────────────────┐
│ Client: Acme Corp                               │
├─────────────────────────────────────────────────┤
│ [Overview] [Policies] [Affiliates] [Invoices]   │
├─────────────────────────────────────────────────┤
│ [+ Add Affiliate]  [📥 Import Excel]            │
│                                                 │
│ All Affiliates (45)                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ Juan Pérez - Enrolled in POL-001 (active)   │ │
│ │ Ana García - Enrolled in POL-002 (active)   │ │
│ │ Pedro López - No active enrollment ⚠️        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Flow:** Client → Affiliates → "Add Affiliate" → Form with optional immediate enrollment

### Enrollment Form

Single form handles owner + dependents creation atomically:

```
┌─────────────────────────────────────────────────────────┐
│ Enroll Affiliate                                        │
├─────────────────────────────────────────────────────────┤
│ Policy: [POL-001 - Health ▼] (pre-selected if from policy)
│                                                         │
│ ─── Owner/Titular ───                                   │
│ Document: [12345678    ]  [🔍 Search existing]          │
│ Name:     [Juan        ] [Pérez        ]                │
│ DOB:      [1985-03-15  ]  Gender: [Male ▼]              │
│ Email:    [juan@email.com]                              │
│                                                         │
│ Coverage: (●) T  ( ) T+1  ( ) T+Family                  │
│                                                         │
│ ─── Dependents ─── (shown if T+1 or T+F selected)       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [+ Add Dependent]                                   │ │
│ │                                                     │ │
│ │ 1. María Pérez (Spouse) - 1987-06-20    [🗑️]        │
│ │ 2. Carlos Pérez (Child) - 2010-09-10    [🗑️]        │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Cancel]                           [Enroll Affiliate]   │
└─────────────────────────────────────────────────────────┘
```

**Form Validation:**
- If T+1 selected, exactly 1 dependent required
- If T selected, no dependents allowed (section hidden)
- If T+F selected, at least 1 dependent recommended
- "Search existing" allows enrolling an existing affiliate in a new policy

### Bulk vs Quick Add

| Scenario | Recommended Method |
|----------|-------------------|
| Initial data load (100+ people) | Excel import |
| Adding one new employee | Quick form |
| Adding employee + family (1-5 people) | Quick form with inline dependents |
| Renewal migration | Bulk import |
| Mid-year additions (few people) | Quick form |

**Don't force bulk for single additions** - it's overkill and slows down common operations.

---

## Schema

### Affiliate

```prisma
model Affiliate {
  id String @id @default(cuid())

  // Identity
  firstName      String
  lastName       String
  documentType   String?
  documentNumber String?

  // Contact
  email String?
  phone String?

  // Demographics
  dateOfBirth   DateTime?
  gender        Gender?
  maritalStatus MaritalStatus?

  // Dependent relationship (only for dependents)
  primaryAffiliateId String?
  primaryAffiliate   Affiliate?  @relation("AffiliateDependents", fields: [primaryAffiliateId], references: [id], onDelete: SetNull)
  dependents         Affiliate[] @relation("AffiliateDependents")
  relationship       DependentRelationship? // SPOUSE, CHILD, PARENT, etc.

  // Ownership
  clientId String
  client   Client @relation(fields: [clientId], references: [id])

  // Optional portal access
  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id])

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  enrollments            PolicyEnrollment[]      // Only for owners
  enrolledAsDependent    EnrollmentDependent[]   @relation("EnrolledAsDependent")
  claimsAsAffiliate      Claim[]                 @relation("ClaimAffiliate")
  claimsAsPatient        Claim[]                 @relation("ClaimPatient")
  files                  AffiliateFile[]
}
```

### PolicyEnrollment

```prisma
model PolicyEnrollment {
  id String @id @default(cuid())

  policyId    String
  policy      Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  // Only primary affiliates (owners) can have enrollments
  affiliateId String
  affiliate   Affiliate @relation(fields: [affiliateId], references: [id], onDelete: Cascade)

  // Coverage tier determines dependent limits
  coverageType CoverageType  // T, TPLUS1, TPLUSF

  // Lifecycle
  startDate   DateTime               @default(now())
  endDate     DateTime?
  startReason EnrollmentStartReason?
  endReason   EnrollmentEndReason?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Explicit dependent tracking
  enrolledDependents EnrollmentDependent[]
  files              EnrollmentFile[]

  @@unique([policyId, affiliateId, startDate])
  @@index([policyId])
  @@index([affiliateId])
  @@index([coverageType])
  @@index([startDate])
  @@index([endDate])
}
```

### EnrollmentDependent

```prisma
model EnrollmentDependent {
  id String @id @default(cuid())

  enrollmentId String
  enrollment   PolicyEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  dependentId String
  dependent   Affiliate @relation("EnrolledAsDependent", fields: [dependentId], references: [id])

  // Audit trail
  addedAt   DateTime  @default(now())
  removedAt DateTime?

  createdAt DateTime @default(now())

  @@unique([enrollmentId, dependentId, addedAt])
  @@index([enrollmentId])
  @@index([dependentId])
}
```

### Coverage Type Enum

```prisma
enum CoverageType {
  T       // Titular only (0 dependents)
  TPLUS1  // Titular + 1 dependent
  TPLUSF  // Titular + Family (unlimited dependents)
}
```

---

## Validation Rules

### Tier Limits

| Coverage Type | Dependents Allowed |
|---------------|-------------------|
| T             | 0 (owner only)    |
| TPLUS1        | Exactly 1         |
| TPLUSF        | Unlimited         |

### Application-Level Validation

```typescript
const TIER_LIMITS = {
  T: 0,
  TPLUS1: 1,
  TPLUSF: 99, // Or actual business max
};

// Rule 1: Only primary affiliates can have enrollments
function validateEnrollmentCreation(affiliate: Affiliate) {
  if (affiliate.primaryAffiliateId !== null) {
    throw new Error("Only primary affiliates can be enrolled directly");
  }
}

// Rule 2: Dependent count must match tier
function validateTierCompliance(enrollment: PolicyEnrollment) {
  const activeDependents = enrollment.enrolledDependents
    .filter(d => d.removedAt === null).length;

  const limit = TIER_LIMITS[enrollment.coverageType];

  if (enrollment.coverageType === 'T' && activeDependents > 0) {
    throw new Error("T coverage allows no dependents");
  }

  if (enrollment.coverageType === 'TPLUS1' && activeDependents !== 1) {
    throw new Error("TPLUS1 requires exactly 1 dependent");
  }

  if (activeDependents > limit) {
    throw new Error(`${enrollment.coverageType} allows max ${limit} dependents`);
  }
}

// Rule 3: Dependent must belong to the owner
function validateDependentRelationship(enrollment: PolicyEnrollment, dependent: Affiliate) {
  if (dependent.primaryAffiliateId !== enrollment.affiliateId) {
    throw new Error("Dependent must belong to the enrollment owner");
  }
}
```

---

## Bulk Import

### Excel Template Structure

Single sheet format with owner and dependent rows:

| Type | DocumentNumber | FirstName | LastName | DateOfBirth | Gender | Relationship | OwnerDocumentNumber | PolicyNumber | CoverageType | StartDate |
|------|----------------|-----------|----------|-------------|--------|--------------|---------------------|--------------|--------------|-----------|
| OWNER | 12345678 | Juan | Pérez | 1985-03-15 | MALE | | | POL-001 | TPLUSF | 2024-01-01 |
| DEPENDENT | 12345679 | María | Pérez | 1987-06-20 | FEMALE | SPOUSE | 12345678 | | | |
| DEPENDENT | 12345680 | Carlos | Pérez | 2010-09-10 | MALE | CHILD | 12345678 | | | |
| OWNER | 22222222 | Ana | García | 1990-01-01 | FEMALE | | | POL-001 | T | 2024-01-01 |
| OWNER | 33333333 | Pedro | López | 1988-05-05 | MALE | | | POL-002 | TPLUS1 | 2024-01-01 |
| DEPENDENT | 33333334 | Lucía | López | 1990-02-02 | FEMALE | SPOUSE | 33333333 | | | |

### Column Rules

| Column | Required For | Description |
|--------|--------------|-------------|
| Type | All | `OWNER` or `DEPENDENT` |
| DocumentNumber | All | Unique identifier for the person |
| FirstName | All | Person's first name |
| LastName | All | Person's last name |
| DateOfBirth | Optional | Format: YYYY-MM-DD |
| Gender | Optional | `MALE`, `FEMALE`, `OTHER` |
| Relationship | Dependents only | `SPOUSE`, `CHILD`, `PARENT`, `DOMESTIC_PARTNER`, `SIBLING`, `OTHER` |
| OwnerDocumentNumber | Dependents only | References the owner's DocumentNumber |
| PolicyNumber | Owners only | The policy to enroll in |
| CoverageType | Owners only | `T`, `TPLUS1`, or `TPLUSF` |
| StartDate | Owners only | Format: YYYY-MM-DD |

### Processing Logic

```typescript
async function bulkImportAffiliates(rows: ExcelRow[], clientId: string) {
  // 1. Separate and validate
  const owners = rows.filter(r => r.type === 'OWNER');
  const dependents = rows.filter(r => r.type === 'DEPENDENT');

  // 2. Pre-validation
  const errors: string[] = [];

  // Check all dependents reference valid owners in batch
  const ownerDocs = new Set(owners.map(o => o.documentNumber));
  for (const dep of dependents) {
    if (!dep.ownerDocumentNumber || !ownerDocs.has(dep.ownerDocumentNumber)) {
      errors.push(`Row ${dep.documentNumber}: Owner ${dep.ownerDocumentNumber} not found in batch`);
    }
  }

  // Check tier compliance
  const dependentsByOwner = groupBy(dependents, 'ownerDocumentNumber');
  for (const owner of owners) {
    const deps = dependentsByOwner[owner.documentNumber] || [];
    const tierLimit = TIER_LIMITS[owner.coverageType!];

    if (owner.coverageType === 'TPLUS1' && deps.length !== 1) {
      errors.push(`Owner ${owner.documentNumber}: TPLUS1 requires exactly 1 dependent, found ${deps.length}`);
    }
    if (owner.coverageType === 'T' && deps.length > 0) {
      errors.push(`Owner ${owner.documentNumber}: T allows no dependents, found ${deps.length}`);
    }
    if (deps.length > tierLimit) {
      errors.push(`Owner ${owner.documentNumber}: ${owner.coverageType} allows max ${tierLimit} dependents`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // 3. Transaction: Create all in correct order
  return await prisma.$transaction(async (tx) => {
    const affiliateMap = new Map<string, string>(); // documentNumber -> id
    const enrollmentMap = new Map<string, string>(); // ownerDocumentNumber -> enrollmentId

    // Step 1: Create all owners
    for (const owner of owners) {
      const affiliate = await tx.affiliate.create({
        data: {
          clientId,
          firstName: owner.firstName,
          lastName: owner.lastName,
          documentNumber: owner.documentNumber,
          dateOfBirth: owner.dateOfBirth ? new Date(owner.dateOfBirth) : null,
          gender: owner.gender as Gender,
        },
      });
      affiliateMap.set(owner.documentNumber, affiliate.id);

      // Step 2: Create enrollment for owner
      const policy = await tx.policy.findFirst({
        where: { policyNumber: owner.policyNumber!, clientId },
      });

      if (!policy) {
        throw new Error(`Policy ${owner.policyNumber} not found`);
      }

      const enrollment = await tx.policyEnrollment.create({
        data: {
          policyId: policy.id,
          affiliateId: affiliate.id,
          coverageType: owner.coverageType as CoverageType,
          startDate: new Date(owner.startDate!),
        },
      });
      enrollmentMap.set(owner.documentNumber, enrollment.id);
    }

    // Step 3: Create all dependents
    for (const dep of dependents) {
      const ownerId = affiliateMap.get(dep.ownerDocumentNumber!);
      const enrollmentId = enrollmentMap.get(dep.ownerDocumentNumber!);

      const affiliate = await tx.affiliate.create({
        data: {
          clientId,
          firstName: dep.firstName,
          lastName: dep.lastName,
          documentNumber: dep.documentNumber,
          dateOfBirth: dep.dateOfBirth ? new Date(dep.dateOfBirth) : null,
          gender: dep.gender as Gender,
          primaryAffiliateId: ownerId,
          relationship: dep.relationship as DependentRelationship,
        },
      });
      affiliateMap.set(dep.documentNumber, affiliate.id);

      // Step 4: Create EnrollmentDependent
      await tx.enrollmentDependent.create({
        data: {
          enrollmentId: enrollmentId!,
          dependentId: affiliate.id,
        },
      });
    }

    return {
      success: true,
      created: {
        owners: owners.length,
        dependents: dependents.length
      }
    };
  });
}
```

### Pre-Import Validation Checks

| Check | When | Error Message |
|-------|------|---------------|
| Owner exists in batch | Pre-validation | "Owner X not found in batch" |
| TPLUS1 has exactly 1 dep | Pre-validation | "TPLUS1 requires exactly 1 dependent" |
| T has 0 deps | Pre-validation | "T allows no dependents" |
| Policy exists | During insert | "Policy X not found" |
| No duplicate documents | Pre-validation | "Duplicate document number" |

---

## Common Scenarios

### Adding a Dependent Mid-Policy

1. Create the `Affiliate` with `primaryAffiliateId` pointing to the owner
2. Create `EnrollmentDependent` linking to the owner's enrollment
3. Update enrollment's `coverageType` if needed (e.g., T → TPLUS1)

### Removing a Dependent

1. Set `removedAt` on the `EnrollmentDependent` record
2. Update enrollment's `coverageType` if needed (e.g., TPLUS1 → T)
3. Optionally set `isActive = false` on the `Affiliate` if completely leaving

### Dependent Ages Out

1. Set `removedAt` on `EnrollmentDependent`
2. Create audit log entry
3. Update tier if needed

### Policy Renewal

1. End current enrollment (set `endDate`, `endReason = POLICY_EXPIRED`)
2. Create new enrollment for new policy period
3. Copy active dependents to new `EnrollmentDependent` records

---

## Data Integrity Summary

| Constraint | Enforcement |
|------------|-------------|
| Only owners can have enrollments | Application validation |
| Dependent must belong to owner | Application validation |
| Tier limits enforced | Application validation |
| Audit trail for dependents | `EnrollmentDependent.addedAt/removedAt` |
| No enrollment drift | Single enrollment per owner, dependents linked separately |

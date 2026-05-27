# Batch 3.0 — JobPostings (Full Stack)

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში) — განსაკუთრებით Multi-tenancy და Money rules
2. `docs/ARCHITECTURE.md` — ყველა ADR
3. `apps/flexup-backend/prisma/schema.prisma` — სრული schema
4. `apps/flexup-backend/src/locations/` — წაშლისთვის გასარკვევი
5. `apps/flexup-backend/src/companies/` — pattern reference
6. `apps/flexup-web/src/routes/` — frontend არსებული structure
7. `packages/shared/src/` — types, enums, schemas

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს:
- Phase 1-2 backend complete (Auth, Users, Companies, Members, **Locations**)
- Phase 2.X/Y/Z complete (shared package, cookies, email verification)
- Frontend F1.1-F1.2 + password reset + company create
- Locations backend + frontend არსებობს, **მაგრამ წავა**

რას ვცვლით:
- ❌ Locations entity, module, frontend — წავა მთლიანად
- 🆕 Reference data: JobSection, JobCategory, Skill, Appearance, Language
- 🆕 JobPosting entity (template) — company + category + address + briefing + cover + contact + requirements
- 🆕 Seed scripts — Temper-based initial data, ka + en localized
- 🆕 Frontend — Job list, create form, detail page

---

## DESIGN PHILOSOPHY

**JobPosting არის template (შაბლონი).** მენეჯერი ერთხელ ქმნის, მერე ცვლების გამოცხადებისას იყენებს. ერთი job → ბევრი shift instance (Shifts მერე separate batch-ში).

**Reference data backend devs-ი SQL-ით მართავს** ჯერ. Admin UI მერე batch-ში.

---

# PART 1 — LOCATIONS REMOVAL

## A. Schema migration

### 1. Prisma schema — წაშალე ეს models:

```prisma
// წავა:
model Location { ... }
model ShiftSeries { ... }   // ეს უკვე გვაქვს, მაგრამ ცარიელია — JobPosting შეცვლის
```

⚠ **Note:** `ShiftSeries`-ი მთლიანად წავა — recurring logic JobPosting-ში გადადის (multiple shifts per job).

### 2. Company model-დან წაშალე

```prisma
// წავა:
locations         Location[]
shiftSeries       ShiftSeries[]
```

### 3. Migration

```bash
npm run db:migrate:dev -- --name remove_locations
```

⚠ **Migration იქნება destructive** — Locations data წავა. ფიქრობდე ცარიელად ცარიელად:
- Dev DB-ში: წავა (acceptable)
- Production-ში: ჯერ არ გვაქვს deploy, ცარიელია

## B. Backend code removal

წაშალე:
- `apps/flexup-backend/src/locations/` — სრული module
- `app.module.ts`-ში `LocationsModule` import-ი
- სხვა module-ებში `Location` references

## C. Frontend code removal

წაშალე:
- `apps/flexup-web/src/routes/.../locations/` (whatever path-ი გაქვს)
- Company sidebar-ში "Locations" link
- Location-related API calls, components, types

## D. Shared types cleanup

წაშალე `packages/shared/src/`-დან:
- `types/location.types.ts` — სრული ფაილი
- `validation/location.schemas.ts` — სრული ფაილი
- Barrel export references

---

# PART 2 — REFERENCE DATA SCHEMA + SEED

## E. Prisma schema — დაამატე

```prisma
// ============================================
// REFERENCE DATA
// ============================================

model JobSection {
  id          String         @id @default(cuid())
  slug        String         @unique                          // "hospitality"
  name        String         @unique                          // "Hospitality"
  nameKa      String                                          // "სასტუმრო-რესტორნები"
  sortOrder   Int            @default(0)
  isActive    Boolean        @default(true)
  
  categories  JobCategory[]
  
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  @@index([sortOrder])
}

model JobCategory {
  id                            String         @id @default(cuid())
  sectionId                     String
  section                       JobSection     @relation(fields: [sectionId], references: [id])
  
  slug                          String         @unique           // "barista-junior"
  title                         String                            // "Barista - Junior"
  titleKa                       String                            // "ბარისტა - ჯუნიორი"
  
  isExperienceRequired          Boolean        @default(false)
  isTippable                    Boolean        @default(false)
  minimumEarningsPerHourMinor   Int                              // 1300 = 13 GEL
  currency                      String         @default("GEL")
  
  sortOrder                     Int            @default(0)
  isActive                      Boolean        @default(true)
  
  jobPostings                   JobPosting[]
  
  createdAt                     DateTime       @default(now())
  updatedAt                     DateTime       @updatedAt
  
  @@index([sectionId])
  @@index([slug])
  @@index([sortOrder])
}

model Skill {
  id          String                 @id @default(cuid())
  slug        String                 @unique                   // "latte-art"
  name        String                 @unique                   // "Latte Art"
  nameKa      String                                            // "ლატე ხელოვნება"
  sortOrder   Int                    @default(0)
  isActive    Boolean                @default(true)
  
  jobPostings JobPostingSkill[]
  
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
  
  @@index([sortOrder])
}

model Appearance {
  id          String                      @id @default(cuid())
  slug        String                      @unique              // "trimmed-beard"
  name        String                      @unique              // "Trimmed beard"
  nameKa      String                                            // "მოვლილი წვერი"
  sortOrder   Int                         @default(0)
  isActive    Boolean                     @default(true)
  
  jobPostings JobPostingAppearance[]
  
  createdAt   DateTime                    @default(now())
  updatedAt   DateTime                    @updatedAt
  
  @@index([sortOrder])
}

model Language {
  id          String                    @id @default(cuid())
  slug        String                    @unique                // "english-speaking"
  name        String                    @unique                // "English speaking skills"
  nameKa      String                                            // "ინგლისურის სალაპარაკო ცოდნა"
  sortOrder   Int                       @default(0)
  isActive    Boolean                   @default(true)
  
  jobPostings JobPostingLanguage[]
  
  createdAt   DateTime                  @default(now())
  updatedAt   DateTime                  @updatedAt
  
  @@index([sortOrder])
}
```

**მნიშვნელოვანი:** ცარიელად ცარიელად `name` (English) და `nameKa` (Georgian) ცალკე fields — i18n native. Backend აბრუნებს ორივეს, frontend აჩვენებს მიმდინარე ენით.

## F. Seed script

`apps/flexup-backend/prisma/seed/reference-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SECTIONS = [
  { slug: 'hospitality', name: 'Hospitality', nameKa: 'სასტუმრო-რესტორნები', sortOrder: 1 },
  { slug: 'retail', name: 'Retail', nameKa: 'საცალო ვაჭრობა', sortOrder: 2 },
  { slug: 'logistics', name: 'Logistics', nameKa: 'ლოგისტიკა', sortOrder: 3 },
  { slug: 'cleaning', name: 'Cleaning', nameKa: 'დასუფთავება', sortOrder: 4 },
  { slug: 'events', name: 'Events', nameKa: 'ღონისძიებები', sortOrder: 5 },
  { slug: 'delivery', name: 'Delivery', nameKa: 'მიწოდება', sortOrder: 6 },
  { slug: 'other', name: 'Other', nameKa: 'სხვა', sortOrder: 99 },
];

const CATEGORIES = [
  // Hospitality
  { sectionSlug: 'hospitality', slug: 'barista-junior', title: 'Barista - Junior', titleKa: 'ბარისტა - ჯუნიორი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'hospitality', slug: 'barista-senior', title: 'Barista - Senior', titleKa: 'ბარისტა - სენიორი', isExperienceRequired: true, isTippable: true, minimumEarningsPerHourMinor: 2000 },
  { sectionSlug: 'hospitality', slug: 'bartender', title: 'Bartender', titleKa: 'ბარმენი', isExperienceRequired: true, isTippable: true, minimumEarningsPerHourMinor: 2500 },
  { sectionSlug: 'hospitality', slug: 'waiter', title: 'Waiter / Waitress', titleKa: 'მიმტანი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'hospitality', slug: 'host-hostess', title: 'Host / Hostess', titleKa: 'ჰოსტი', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'hospitality', slug: 'kitchen-porter', title: 'Kitchen Porter', titleKa: 'სამზარეულოს თანაშემწე', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'hospitality', slug: 'commis-chef', title: 'Commis Chef', titleKa: 'მზარეული - ჯუნიორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2000 },
  { sectionSlug: 'hospitality', slug: 'chef-de-partie', title: 'Chef de Partie', titleKa: 'მზარეული - სენიორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2800 },
  { sectionSlug: 'hospitality', slug: 'sous-chef', title: 'Sous Chef', titleKa: 'სუ-შეფი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 3500 },
  { sectionSlug: 'hospitality', slug: 'assistant-manager', title: 'Assistant Manager', titleKa: 'მენეჯერის თანაშემწე', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2500 },
  
  // Retail
  { sectionSlug: 'retail', slug: 'sales-assistant', title: 'Sales Assistant', titleKa: 'გაყიდვების კონსულტანტი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'retail', slug: 'cashier', title: 'Cashier', titleKa: 'მოლარე', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'retail', slug: 'stock-assistant', title: 'Stock Assistant', titleKa: 'მარაგების მენეჯერი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  
  // Logistics
  { sectionSlug: 'logistics', slug: 'warehouse-worker', title: 'Warehouse Worker', titleKa: 'საწყობის თანამშრომელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1600 },
  { sectionSlug: 'logistics', slug: 'forklift-operator', title: 'Forklift Operator', titleKa: 'ფორკლიფტის ოპერატორი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2200 },
  { sectionSlug: 'logistics', slug: 'order-picker', title: 'Order Picker', titleKa: 'შეკვეთის შემგროვებელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  
  // Cleaning
  { sectionSlug: 'cleaning', slug: 'cleaning', title: 'Cleaning', titleKa: 'დასუფთავება', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1300 },
  { sectionSlug: 'cleaning', slug: 'housekeeping', title: 'Housekeeping', titleKa: 'სასტუმროს დასუფთავება', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1400 },
  
  // Events
  { sectionSlug: 'events', slug: 'event-staff', title: 'Event Staff', titleKa: 'ღონისძიების თანამშრომელი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  { sectionSlug: 'events', slug: 'event-host', title: 'Event Host', titleKa: 'ღონისძიების წამყვანი', isExperienceRequired: true, isTippable: false, minimumEarningsPerHourMinor: 2500 },
  { sectionSlug: 'events', slug: 'promoter', title: 'Promoter', titleKa: 'პრომოუტერი', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1500 },
  
  // Delivery
  { sectionSlug: 'delivery', slug: 'food-delivery', title: 'Food Delivery', titleKa: 'საკვების მიწოდება', isExperienceRequired: false, isTippable: true, minimumEarningsPerHourMinor: 1500 },
  
  // Other
  { sectionSlug: 'other', slug: 'other', title: 'Other', titleKa: 'სხვა', isExperienceRequired: false, isTippable: false, minimumEarningsPerHourMinor: 1300 },
];

const SKILLS = [
  { slug: '1-year-experience', name: '>1 year experience', nameKa: '1+ წლის გამოცდილება', sortOrder: 1 },
  { slug: '2-years-experience', name: '>2 years experience', nameKa: '2+ წლის გამოცდილება', sortOrder: 2 },
  { slug: 'registrations', name: 'Registrations', nameKa: 'რეგისტრაცია', sortOrder: 10 },
  { slug: 'taking-reservations', name: 'Taking reservations', nameKa: 'ჯავშნის მიღება', sortOrder: 11 },
  { slug: 'strong-communication', name: 'Strong communication skills', nameKa: 'ძლიერი კომუნიკაცია', sortOrder: 12 },
  { slug: 'customer-service', name: 'Customer Service', nameKa: 'მომხმარებელთა მომსახურება', sortOrder: 13 },
  { slug: 'latte-art', name: 'Latte Art', nameKa: 'ლატე ხელოვნება', sortOrder: 14 },
  { slug: 'milk-steaming', name: 'Milk steaming skills', nameKa: 'რძის ორთქლვა', sortOrder: 15 },
  { slug: 'answering-emails', name: 'Answering e-mails', nameKa: 'ემეილების მართვა', sortOrder: 16 },
  { slug: 'booking-system', name: 'Working with booking system', nameKa: 'ჯავშნის სისტემასთან მუშაობა', sortOrder: 17 },
  { slug: 'check-in-guests', name: 'Check-in guests', nameKa: 'სტუმრების მიღება', sortOrder: 18 },
  { slug: 'check-out-guests', name: 'Check-out guests', nameKa: 'სტუმრების გასვლის გაფორმება', sortOrder: 19 },
  { slug: 'first-aid', name: 'First Aid Qualified', nameKa: 'პირველადი დახმარების სერტიფიკატი', sortOrder: 20 },
  { slug: 'team-leadership', name: 'Team Leadership Experience', nameKa: 'გუნდის ლიდერობის გამოცდილება', sortOrder: 21 },
  { slug: 'cooking-experience', name: 'Cooking experience', nameKa: 'სამზარეულოს გამოცდილება', sortOrder: 22 },
  { slug: 'food-handling', name: 'Food handling certificate', nameKa: 'საკვებთან მუშაობის სერტიფიკატი', sortOrder: 23 },
  { slug: 'cash-handling', name: 'Cash handling', nameKa: 'ნაღდი ფულის მართვა', sortOrder: 24 },
  { slug: 'pos-system', name: 'POS system experience', nameKa: 'POS სისტემის გამოცდილება', sortOrder: 25 },
];

const APPEARANCES = [
  { slug: 'trimmed-beard', name: 'Trimmed beard', nameKa: 'მოვლილი წვერი', sortOrder: 1 },
  { slug: 'clean-shaven', name: 'Clean-shaven', nameKa: 'გაპარსული', sortOrder: 2 },
  { slug: 'no-visible-tattoos', name: 'No visible tattoos', nameKa: 'არ ჩანდეს ტატუ', sortOrder: 3 },
  { slug: 'no-visible-piercings', name: 'No visible piercings', nameKa: 'არ ჩანდეს პირსინგი', sortOrder: 4 },
  { slug: 'no-striking-jewellery', name: 'No striking jewellery', nameKa: 'არ იყოს მკვეთრი ბიჟუტერია', sortOrder: 5 },
  { slug: 'no-nail-polish', name: 'No nail polish / fake nails', nameKa: 'უფრჩხილო ფერი ან ხელოვნური ფრჩხილები', sortOrder: 6 },
  { slug: 'plain-white-tshirt', name: 'Plain white t-shirt', nameKa: 'მარტივი თეთრი მაისური', sortOrder: 10 },
  { slug: 'plain-black-tshirt', name: 'Plain black t-shirt', nameKa: 'მარტივი შავი მაისური', sortOrder: 11 },
  { slug: 'white-dress-shirt', name: 'White dress shirt', nameKa: 'თეთრი პერანგი', sortOrder: 12 },
  { slug: 'black-dress-shirt', name: 'Black dress shirt', nameKa: 'შავი პერანგი', sortOrder: 13 },
  { slug: 'black-smart-trousers', name: 'Black smart trousers', nameKa: 'შავი ოფიციალური შარვალი', sortOrder: 14 },
  { slug: 'smart-trousers', name: 'Smart trousers', nameKa: 'ოფიციალური შარვალი', sortOrder: 15 },
  { slug: 'black-jeans', name: 'Black jeans', nameKa: 'შავი ჯინსი', sortOrder: 16 },
  { slug: 'suit', name: 'Suit', nameKa: 'კოსტუმი', sortOrder: 17 },
  { slug: 'blazer', name: 'Blazer', nameKa: 'პიჯაკი', sortOrder: 18 },
  { slug: 'uniform-on-site', name: 'Uniform provided on site', nameKa: 'უნიფორმა ადგილზე გადაეცემა', sortOrder: 20 },
];

const LANGUAGES = [
  { slug: 'english-speaking', name: 'English speaking skills', nameKa: 'ინგლისურის სალაპარაკო ცოდნა', sortOrder: 1 },
  { slug: 'english-written', name: 'Written English skills', nameKa: 'ინგლისურის წერითი ცოდნა', sortOrder: 2 },
  { slug: 'russian-speaking', name: 'Russian speaking skills', nameKa: 'რუსულის სალაპარაკო ცოდნა', sortOrder: 3 },
  { slug: 'russian-written', name: 'Written Russian skills', nameKa: 'რუსულის წერითი ცოდნა', sortOrder: 4 },
  { slug: 'georgian-speaking', name: 'Georgian speaking skills', nameKa: 'ქართულის სალაპარაკო ცოდნა', sortOrder: 5 },
  { slug: 'georgian-written', name: 'Written Georgian skills', nameKa: 'ქართულის წერითი ცოდნა', sortOrder: 6 },
];

async function seedReferenceData() {
  console.log('Seeding reference data...');
  
  // Sections (upsert by slug)
  const sectionMap: Record<string, string> = {};
  for (const section of SECTIONS) {
    const created = await prisma.jobSection.upsert({
      where: { slug: section.slug },
      create: section,
      update: section,
    });
    sectionMap[section.slug] = created.id;
  }
  
  // Categories
  for (const cat of CATEGORIES) {
    const { sectionSlug, ...rest } = cat;
    await prisma.jobCategory.upsert({
      where: { slug: cat.slug },
      create: { ...rest, sectionId: sectionMap[sectionSlug]! },
      update: { ...rest, sectionId: sectionMap[sectionSlug]! },
    });
  }
  
  // Skills, Appearances, Languages
  for (const skill of SKILLS) {
    await prisma.skill.upsert({ where: { slug: skill.slug }, create: skill, update: skill });
  }
  for (const app of APPEARANCES) {
    await prisma.appearance.upsert({ where: { slug: app.slug }, create: app, update: app });
  }
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({ where: { slug: lang.slug }, create: lang, update: lang });
  }
  
  console.log('✅ Reference data seeded');
}

seedReferenceData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Update `apps/flexup-backend/package.json` scripts:
```json
"prisma:seed": "sh -lc 'set -a; . ../../.env; set +a; ts-node -r tsconfig-paths/register prisma/seed/reference-data.ts'"
```

⚠ **მნიშვნელოვანი:** Seed `upsert`-ით — idempotent, რომელიც ცარიელად ცარიელად მუშავდება ხელახლა გაშვებისას.

---

# PART 3 — JOBPOSTING SCHEMA

## G. Prisma schema — დაამატე

```prisma
model JobPosting {
  id                  String                      @id @default(cuid())
  
  // Ownership
  companyId           String
  company             Company                     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  categoryId          String
  category            JobCategory                 @relation(fields: [categoryId], references: [id])
  createdById         String
  createdBy           User                        @relation("JobCreatedBy", fields: [createdById], references: [id])
  
  // Basic info
  title               String                                      // up to 200 chars
  briefing            String                      @db.Text        // up to 7500 chars (app validated)
  coverPhotoUrl       String?
  
  // Address (from Python autocomplete service — frontend supplies)
  addressLine         String                                      // "ვაჟა-ფშაველას გამზ. 76"
  city                String
  country             String                      @default("GE")
  postalCode          String?
  latitude            Float?
  longitude           Float?
  
  // Contact
  contactPersonName   String
  contactPersonPhone  String                                      // E.164 ან freeform
  
  // Lifecycle
  isArchived          Boolean                     @default(false)
  archivedAt          DateTime?
  
  // Requirements (many-to-many)
  skills              JobPostingSkill[]
  appearances         JobPostingAppearance[]
  languages           JobPostingLanguage[]
  
  // Future: shifts mapped here in next batch
  
  createdAt           DateTime                    @default(now())
  updatedAt           DateTime                    @updatedAt
  
  @@index([companyId])
  @@index([categoryId])
  @@index([city])
  @@index([latitude, longitude])
  @@index([isArchived])
}

model JobPostingSkill {
  jobPostingId    String
  skillId         String
  
  jobPosting      JobPosting      @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  skill           Skill           @relation(fields: [skillId], references: [id])
  
  @@id([jobPostingId, skillId])
  @@index([skillId])
}

model JobPostingAppearance {
  jobPostingId    String
  appearanceId    String
  
  jobPosting      JobPosting      @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  appearance      Appearance      @relation(fields: [appearanceId], references: [id])
  
  @@id([jobPostingId, appearanceId])
  @@index([appearanceId])
}

model JobPostingLanguage {
  jobPostingId    String
  languageId      String
  
  jobPosting      JobPosting      @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  language        Language        @relation(fields: [languageId], references: [id])
  
  @@id([jobPostingId, languageId])
  @@index([languageId])
}
```

Update User model:
```prisma
model User {
  // ... existing
  createdJobPostings  JobPosting[]   @relation("JobCreatedBy")
}
```

Update Company model:
```prisma
model Company {
  // ... existing (already minus locations and shiftSeries)
  jobPostings    JobPosting[]
}
```

Migration:
```bash
npm run db:migrate:dev -- --name job_postings_and_reference_data
```

---

# PART 4 — BACKEND CODE

## H. Shared types

`packages/shared/src/types/reference-data.types.ts`:

```typescript
export interface JobSectionResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface JobCategoryResponse {
  id: string;
  sectionId: string;
  section?: JobSectionResponse;
  slug: string;
  title: string;
  titleKa: string;
  isExperienceRequired: boolean;
  isTippable: boolean;
  minimumEarningsPerHourMinor: number;
  currency: string;
  sortOrder: number;
}

export interface SkillResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface AppearanceResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}

export interface LanguageResponse {
  id: string;
  slug: string;
  name: string;
  nameKa: string;
  sortOrder: number;
}
```

`packages/shared/src/types/job-posting.types.ts`:

```typescript
import type { JobCategoryResponse, SkillResponse, AppearanceResponse, LanguageResponse } from './reference-data.types';

export interface JobPostingResponse {
  id: string;
  companyId: string;
  category: JobCategoryResponse;
  createdById: string;
  
  title: string;
  briefing: string;
  coverPhotoUrl: string | null;
  
  addressLine: string;
  city: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  
  contactPersonName: string;
  contactPersonPhone: string;
  
  isArchived: boolean;
  archivedAt: string | null;
  
  skills: SkillResponse[];
  appearances: AppearanceResponse[];
  languages: LanguageResponse[];
  
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingListItemResponse {
  id: string;
  companyId: string;
  title: string;
  categoryTitle: string;
  categoryTitleKa: string;
  city: string;
  coverPhotoUrl: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface CreateJobPostingRequest {
  companyId: string;
  categoryId: string;
  title: string;
  briefing: string;
  
  // Address (frontend supplies from autocomplete)
  addressLine: string;
  city: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  
  contactPersonName: string;
  contactPersonPhone: string;
  
  skillIds: string[];
  appearanceIds: string[];
  languageIds: string[];
}

export type UpdateJobPostingRequest = Partial<Omit<CreateJobPostingRequest, 'companyId'>>;

export interface JobPostingListQuery {
  page?: number;
  limit?: number;
  search?: string;        // by title
  categoryId?: string;
  city?: string;
  isArchived?: boolean;
}
```

`packages/shared/src/validation/job-posting.schemas.ts`:

```typescript
import { z } from 'zod';

export const createJobPostingSchema = z.object({
  companyId: z.string().min(1),
  categoryId: z.string().min(1),
  title: z.string().min(3).max(200).trim(),
  briefing: z.string().min(10).max(7500),
  
  addressLine: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  country: z.string().length(2).optional().default('GE'),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  contactPersonName: z.string().min(1).max(200),
  contactPersonPhone: z.string().min(5).max(50),
  
  skillIds: z.array(z.string()).max(20).default([]),
  appearanceIds: z.array(z.string()).max(15).default([]),
  languageIds: z.array(z.string()).max(5).default([]),
}).refine(
  (data) => (data.latitude !== undefined) === (data.longitude !== undefined),
  { message: 'latitude and longitude must be provided together' }
);

export const updateJobPostingSchema = createJobPostingSchema
  .omit({ companyId: true })
  .partial();

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
```

Add new error codes to `packages/shared/src/types/error.types.ts`:
```typescript
JOB_POSTING_HAS_SHIFTS = 'JOB_POSTING_HAS_SHIFTS',
INVALID_CATEGORY = 'INVALID_CATEGORY',
INVALID_SKILL = 'INVALID_SKILL',
INVALID_APPEARANCE = 'INVALID_APPEARANCE',
INVALID_LANGUAGE = 'INVALID_LANGUAGE',
```

## I. Reference Data Module (read-only API)

`src/reference-data/reference-data.module.ts`:

```typescript
@Module({
  providers: [ReferenceDataService],
  controllers: [ReferenceDataController],
  exports: [ReferenceDataService],
})
export class ReferenceDataModule {}
```

`src/reference-data/reference-data.service.ts`:

```typescript
@Injectable()
export class ReferenceDataService {
  constructor(private readonly prisma: PrismaService) {}
  
  async getSections() {
    return this.prisma.jobSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
  
  async getCategories(sectionId?: string) {
    return this.prisma.jobCategory.findMany({
      where: { 
        isActive: true,
        ...(sectionId ? { sectionId } : {}),
      },
      include: { section: true },
      orderBy: [{ section: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }
  
  async getCategoryById(id: string) {
    return this.prisma.jobCategory.findUnique({
      where: { id },
      include: { section: true },
    });
  }
  
  async getSkills() {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
  
  async getAppearances() {
    return this.prisma.appearance.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
  
  async getLanguages() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
  
  async validateSkillIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.prisma.skill.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_SKILL,
        message: 'One or more skills are invalid',
      });
    }
  }
  
  // Same for appearances, languages, category
  // ... (analog methods)
}
```

`src/reference-data/reference-data.controller.ts`:

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/reference/sections` | JobSectionResponse[] |
| GET | `/api/reference/categories?sectionId=` | JobCategoryResponse[] |
| GET | `/api/reference/skills` | SkillResponse[] |
| GET | `/api/reference/appearances` | AppearanceResponse[] |
| GET | `/api/reference/languages` | LanguageResponse[] |

**ყველა Public** (`@Public()`) — frontend-ი authenticated/unauthenticated ერთად ხედავს. Cache headers: `Cache-Control: public, max-age=300` (5 წუთი).

## J. JobPostings Module

`src/job-postings/job-postings.module.ts`:

```typescript
@Module({
  imports: [ReferenceDataModule],
  providers: [JobPostingsService],
  controllers: [JobPostingsController],
  exports: [JobPostingsService],
})
export class JobPostingsModule {}
```

`src/job-postings/job-postings.service.ts`:

```typescript
@Injectable()
export class JobPostingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceData: ReferenceDataService,
    private readonly configService: ConfigService,
  ) {}
  
  async create(userId: string, companyId: string, dto: CreateJobPostingInput): Promise<JobPostingResponse> {
    // 1. Validate category
    const category = await this.referenceData.getCategoryById(dto.categoryId);
    if (!category?.isActive) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_CATEGORY,
        message: 'Category not found or inactive',
      });
    }
    
    // 2. Validate all referenced IDs
    await this.referenceData.validateSkillIds(dto.skillIds);
    await this.referenceData.validateAppearanceIds(dto.appearanceIds);
    await this.referenceData.validateLanguageIds(dto.languageIds);
    
    // 3. Coordinate pair check (already in Zod, double-check defensively)
    if ((dto.latitude !== undefined) !== (dto.longitude !== undefined)) {
      throw new BadRequestException('latitude/longitude must be paired');
    }
    
    // 4. Create in transaction
    const job = await this.prisma.jobPosting.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        createdById: userId,
        title: dto.title,
        briefing: dto.briefing,
        addressLine: dto.addressLine,
        city: dto.city,
        country: dto.country || 'GE',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPersonName: dto.contactPersonName,
        contactPersonPhone: dto.contactPersonPhone,
        skills: { create: dto.skillIds.map(skillId => ({ skillId })) },
        appearances: { create: dto.appearanceIds.map(appearanceId => ({ appearanceId })) },
        languages: { create: dto.languageIds.map(languageId => ({ languageId })) },
      },
      include: this.includeAll(),
    });
    
    return this.toResponse(job);
  }
  
  async findByCompany(companyId: string, query: JobPostingListQuery): Promise<PaginatedResponse<JobPostingListItemResponse>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    
    const where: Prisma.JobPostingWhereInput = {
      companyId,
      ...(query.isArchived !== undefined ? { isArchived: query.isArchived } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    
    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);
    
    return {
      data: items.map(this.toListItem),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  
  async findById(companyId: string, id: string): Promise<JobPostingResponse> {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id, companyId },
      include: this.includeAll(),
    });
    if (!job) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Job posting not found',
      });
    }
    return this.toResponse(job);
  }
  
  async update(companyId: string, id: string, dto: UpdateJobPostingInput): Promise<JobPostingResponse> {
    // Existence check
    await this.findById(companyId, id);
    
    // Validate references if changed
    if (dto.categoryId) {
      const cat = await this.referenceData.getCategoryById(dto.categoryId);
      if (!cat?.isActive) throw new BadRequestException({ code: ErrorCode.INVALID_CATEGORY, message: 'Invalid category' });
    }
    if (dto.skillIds) await this.referenceData.validateSkillIds(dto.skillIds);
    if (dto.appearanceIds) await this.referenceData.validateAppearanceIds(dto.appearanceIds);
    if (dto.languageIds) await this.referenceData.validateLanguageIds(dto.languageIds);
    
    // Transaction: update job + sync join tables (if provided)
    const job = await this.prisma.$transaction(async (tx) => {
      // Update scalar fields
      await tx.jobPosting.update({
        where: { id },
        data: {
          ...(dto.categoryId && { categoryId: dto.categoryId }),
          ...(dto.title && { title: dto.title }),
          ...(dto.briefing !== undefined && { briefing: dto.briefing }),
          ...(dto.addressLine && { addressLine: dto.addressLine }),
          ...(dto.city && { city: dto.city }),
          ...(dto.country && { country: dto.country }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.contactPersonName && { contactPersonName: dto.contactPersonName }),
          ...(dto.contactPersonPhone && { contactPersonPhone: dto.contactPersonPhone }),
        },
      });
      
      // Sync skills if provided
      if (dto.skillIds) {
        await tx.jobPostingSkill.deleteMany({ where: { jobPostingId: id } });
        if (dto.skillIds.length > 0) {
          await tx.jobPostingSkill.createMany({
            data: dto.skillIds.map(skillId => ({ jobPostingId: id, skillId })),
          });
        }
      }
      // Similar for appearances, languages
      if (dto.appearanceIds) {
        await tx.jobPostingAppearance.deleteMany({ where: { jobPostingId: id } });
        if (dto.appearanceIds.length > 0) {
          await tx.jobPostingAppearance.createMany({
            data: dto.appearanceIds.map(appearanceId => ({ jobPostingId: id, appearanceId })),
          });
        }
      }
      if (dto.languageIds) {
        await tx.jobPostingLanguage.deleteMany({ where: { jobPostingId: id } });
        if (dto.languageIds.length > 0) {
          await tx.jobPostingLanguage.createMany({
            data: dto.languageIds.map(languageId => ({ jobPostingId: id, languageId })),
          });
        }
      }
      
      return tx.jobPosting.findUniqueOrThrow({
        where: { id },
        include: this.includeAll(),
      });
    });
    
    return this.toResponse(job);
  }
  
  async setArchived(companyId: string, id: string, isArchived: boolean): Promise<JobPostingResponse> {
    await this.findById(companyId, id);
    const job = await this.prisma.jobPosting.update({
      where: { id },
      data: { 
        isArchived, 
        archivedAt: isArchived ? new Date() : null,
      },
      include: this.includeAll(),
    });
    return this.toResponse(job);
  }
  
  async delete(companyId: string, id: string): Promise<void> {
    const job = await this.findById(companyId, id);
    // Future: check Shifts count, block if > 0
    // const shiftsCount = await this.prisma.shift.count({ where: { jobPostingId: id } });
    // if (shiftsCount > 0) {
    //   throw new ConflictException({ code: ErrorCode.JOB_POSTING_HAS_SHIFTS, ... });
    // }
    await this.prisma.jobPosting.delete({ where: { id } });
  }
  
  async uploadCoverPhoto(companyId: string, id: string, file: Express.Multer.File): Promise<JobPostingResponse> {
    // Same pattern as company logo
    // ... (sharp resize to 1280x720, save to uploads/job-covers/, update jobPosting.coverPhotoUrl)
  }
  
  async removeCoverPhoto(companyId: string, id: string): Promise<JobPostingResponse> {
    // ... 
  }
  
  // Private helpers
  private includeAll() {
    return {
      category: { include: { section: true } },
      skills: { include: { skill: true } },
      appearances: { include: { appearance: true } },
      languages: { include: { language: true } },
    };
  }
  
  private toResponse(job: any /* fully included */): JobPostingResponse {
    return {
      id: job.id,
      companyId: job.companyId,
      category: { /* map category */ },
      createdById: job.createdById,
      title: job.title,
      briefing: job.briefing,
      coverPhotoUrl: job.coverPhotoUrl,
      addressLine: job.addressLine,
      city: job.city,
      country: job.country,
      postalCode: job.postalCode,
      latitude: job.latitude,
      longitude: job.longitude,
      contactPersonName: job.contactPersonName,
      contactPersonPhone: job.contactPersonPhone,
      isArchived: job.isArchived,
      archivedAt: job.archivedAt?.toISOString() ?? null,
      skills: job.skills.map((s: any) => /* SkillResponse */ s.skill),
      appearances: job.appearances.map((a: any) => a.appearance),
      languages: job.languages.map((l: any) => l.language),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
  
  private toListItem(job: any /* with category */): JobPostingListItemResponse {
    return {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      categoryTitle: job.category.title,
      categoryTitleKa: job.category.titleKa,
      city: job.city,
      coverPhotoUrl: job.coverPhotoUrl,
      isArchived: job.isArchived,
      createdAt: job.createdAt.toISOString(),
    };
  }
}
```

## K. JobPostings Controller

| Method | Path | Min role | Returns |
|--------|------|----------|---------|
| POST | `/api/companies/:companyId/job-postings` | MANAGER | 201 + JobPostingResponse |
| GET | `/api/companies/:companyId/job-postings` | VIEWER | 200 + Paginated |
| GET | `/api/companies/:companyId/job-postings/:id` | VIEWER | 200 + JobPostingResponse |
| PATCH | `/api/companies/:companyId/job-postings/:id` | MANAGER | 200 + JobPostingResponse |
| PATCH | `/api/companies/:companyId/job-postings/:id/archive` | MANAGER | 200 (body: `{isArchived}`) |
| DELETE | `/api/companies/:companyId/job-postings/:id` | OWNER | 204 |
| POST | `/api/companies/:companyId/job-postings/:id/cover-photo` | MANAGER | 200 + JobPostingResponse |
| DELETE | `/api/companies/:companyId/job-postings/:id/cover-photo` | MANAGER | 200 + JobPostingResponse |

All endpoints: `@UseGuards(JwtAuthGuard, CompanyAccessGuard)` + `@RequireCompanyRole(...)`.

---

# PART 5 — FRONTEND

## L. Translation keys

`apps/flexup-web/src/locales/ka/jobs.json`:

```json
{
  "title": "ვაკანსიები",
  "subtitle": "სამუშაოს შაბლონები შენი კომპანიისთვის",
  "noJobs": "ვაკანსიები ჯერ არ გაქვს",
  "noJobsHint": "შექმენი პირველი ვაკანსია — შემდეგ მისზე ცვლები გამოვაცხადებთ",
  "create": "ვაკანსიის შექმნა",
  "edit": "რედაქტირება",
  "archive": "არქივი",
  "unarchive": "არქივიდან აღდგენა",
  "archived": "დაარქივებული",
  "active": "აქტიური",
  "delete": "წაშლა",
  "deleteConfirm": "ნამდვილად გინდა ვაკანსიის წაშლა? ეს ქმედება ვერ უკუიქცევა.",
  "form": {
    "company": "კომპანია",
    "companyPlaceholder": "აირჩიე კომპანია",
    "category": "კატეგორია",
    "categoryPlaceholder": "აირჩიე კატეგორია",
    "section": "სექცია",
    "title": "ვაკანსიის დასახელება",
    "titlePlaceholder": "მაგ: ბარისტა საღამოს ცვლა",
    "briefing": "აღწერა",
    "briefingPlaceholder": "აღწერე სამუშაოს დეტალები, მოთხოვნები, გარემო...",
    "briefingHint": "მაქს 7500 სიმბოლო",
    "coverPhoto": "ფონური ფოტო",
    "coverPhotoHint": "16:9 აპექტი, max 5MB (JPG, PNG, WebP)",
    "address": "მისამართი",
    "addressPlaceholder": "მოძებნე მისამართი...",
    "contactPerson": "საკონტაქტო პირი",
    "contactPersonName": "სახელი",
    "contactPersonPhone": "ტელეფონი",
    "skills": "უნარები",
    "skillsHint": "მონიშნე რა უნარები სჭირდება ფლექსერს",
    "appearance": "გარეგნობა",
    "appearanceHint": "მონიშნე გარეგნული მოთხოვნები",
    "languages": "ენები",
    "languagesHint": "მონიშნე საჭირო ენები",
    "submit": "შენახვა",
    "saving": "ინახება..."
  },
  "categoryMeta": {
    "minPay": "მინ. {{rate}} ₾/საათი",
    "tippable": "სარჩო",
    "experienced": "გამოცდილი"
  }
}
```

ანალოგიური `en/jobs.json` ინგლისურად.

## M. Address autocomplete component

`apps/flexup-web/src/shared/components/AddressAutocomplete.tsx`:

```typescript
interface AddressAutocompleteProps {
  value: string;
  onSelect: (result: AddressResult) => void;
  onChange: (value: string) => void;
}

interface AddressResult {
  displayName: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

// Calls env-configured Python service
// VITE_ADDRESS_AUTOCOMPLETE_URL=http://localhost:8000/api/address/search
export function AddressAutocomplete({ value, onSelect, onChange }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedValue = useDebounce(value, 300);
  
  useEffect(() => {
    if (debouncedValue.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const url = `${import.meta.env.VITE_ADDRESS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(debouncedValue)}`;
    fetch(url)
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [debouncedValue]);
  
  // Combobox UI with results
  // Click result → call onSelect
}
```

**⚠ Frontend env:** `apps/flexup-web/.env`:
```
VITE_ADDRESS_AUTOCOMPLETE_URL=http://localhost:8000/api/address/search
```

**⚠ Backend არ ცდის** address autocomplete — frontend პირდაპირ. Backend მხოლოდ ინახავს structured data.

## N. Routes

### `src/routes/companies/$companyId/jobs/index.tsx`
Job listing — cards with cover photo, title, category, city, archived badge

### `src/routes/companies/$companyId/jobs/new.tsx`
Create form — sections:
1. **Basics** — Company display (preselected from URL), Category cascade (Section → Category)
2. **Description** — Title, Briefing (textarea with char counter), Cover photo upload
3. **Location** — AddressAutocomplete component
4. **Contact** — Name, Phone
5. **Requirements** — Skills (multi-checkbox grid), Appearance (multi-checkbox grid), Languages (multi-checkbox)

### `src/routes/companies/$companyId/jobs/$jobId/index.tsx`
Detail view — read-only display + "Edit" button

### `src/routes/companies/$companyId/jobs/$jobId/edit.tsx`
Edit form — same as create but pre-populated

### `src/routes/companies/$companyId/jobs/$jobId/delete.tsx` (modal или confirm)

## O. Reference data hook

`src/features/jobs/api/reference-data.api.ts`:

```typescript
export function useSections() {
  return useQuery({
    queryKey: ['reference', 'sections'],
    queryFn: () => apiRequest<JobSectionResponse[]>('/reference/sections'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(sectionId?: string) {
  return useQuery({
    queryKey: ['reference', 'categories', sectionId],
    queryFn: () => apiRequest<JobCategoryResponse[]>(`/reference/categories${sectionId ? `?sectionId=${sectionId}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkills() { /* same pattern */ }
export function useAppearances() { /* same pattern */ }
export function useLanguages() { /* same pattern */ }
```

---

## ACCEPTANCE CRITERIA

### Build
```bash
# Root
npm install
npm run build -w @flexup/shared

# Backend
cd apps/flexup-backend
npm run build && npm run lint
npm run db:migrate:dev -- --name remove_locations
npm run db:migrate:dev -- --name job_postings_and_reference_data
npm run prisma:seed

# Frontend
cd ../flexup-web
npm run build && npm run lint
```

### Manual E2E

**1. Seed data exists:**
```bash
docker compose exec postgres psql -U flexup -d flexup -c "SELECT count(*) FROM \"JobSection\";"
# > 0
docker compose exec postgres psql -U flexup -d flexup -c "SELECT count(*) FROM \"JobCategory\";"
# > 20
docker compose exec postgres psql -U flexup -d flexup -c "SELECT count(*) FROM \"Skill\";"
# > 15
```

**2. Reference data API:**
```bash
curl http://localhost:3002/api/reference/sections | jq
# Array of sections with ka/en names

curl http://localhost:3002/api/reference/categories | jq
# All categories with section nested
```

**3. Create job:**
- Login → navigate to company → "ვაკანსიის შექმნა"
- შეავსე form ცარიელად:
  - Category: Hospitality → Barista - Junior
  - Title: "ჩემი პირველი ვაკანსია"
  - Briefing: 100+ char text
  - Cover: upload 1280x720 image (or smaller — sharp resize)
  - Address: search "ვაჟა" → select from autocomplete
  - Contact: name + phone
  - Skills: check 3-5
  - Appearance: check 2-3
  - Languages: check 1
- Submit
- **Expected:** 201, redirect to job detail page

**4. Job appears in listing:**
- Back to /companies/.../jobs
- **Expected:** card with cover, title, category, city

**5. Edit job:**
- Click "რედაქტირება"
- Change title
- Save
- **Expected:** updated in detail

**6. Archive job:**
- Click "არქივი"
- **Expected:** archived badge, hidden from default list (filter shows it)

**7. Filter archived:**
- Toggle "Show archived"
- **Expected:** archived job visible

**8. VIEWER role cannot create:**
- Add user as VIEWER, login, try create
- **Expected:** 403

**9. Cross-company isolation:**
- Create second company different owner
- Try `/api/companies/:other/job-postings/:job1Id` — second owner
- **Expected:** 403 (NOT_COMPANY_MEMBER or 404)

**10. Cover photo upload:**
- Upload non-image (e.g., .txt) → 400
- Upload >5MB → 413
- Upload valid JPG → 200, file in `uploads/job-covers/`
- File is WebP, ≤1280x720

**11. Skills validation:**
- POST with fake skillId → 400, code "INVALID_SKILL"

**12. Coordinate pair validation:**
- POST with latitude only → 400

**13. Address autocomplete:**
- Type "ვაჟა" in form
- Suggestions dropdown appears (from Python service)
- Click → fields populate (city, lat, lng)

**14. Briefing length:**
- Submit 7501-char briefing → 400
- 7500 → OK

**15. i18n:**
- Switch language → category names switch (ka ↔ en)
- Form labels switch

---

## CONSTRAINTS

1. **არ შეცვალო** `prisma/schema.prisma` Companies/Users/Auth/Members rules — only add JobPosting + reference data, remove Location/ShiftSeries
2. **არ შეცვალო** Auth, Users, Companies, Members modules
3. **არ ააშენო** admin UI reference data-სთვის (SQL მართვა ჯერ)
4. **არ გააკეთო** Shift entity ამ batch-ში — ცალკე batch მერე
5. **არ გააკეთო** backend address autocomplete — frontend პირდაპირ Python service-ს
6. **არ გამოიყენო `any`** — explicit types
7. **არასოდეს Prisma Type controller response-ში** — mapper layer ყოველთვის
8. **არ გამოიყენო** ერთიანი `JobRequirement` polymorphic — ცალკე Skill/Appearance/Language
9. **არ შეცვალო** existing Locations data migration იქცა (development DB — destructive OK)
10. **არ შექმნა** Markdown editor briefing-ისთვის — plain textarea (V2 feature)
11. **არ შექმნა** slug auto-generation JobPosting-ში — მხოლოდ reference data
12. **მკაცრად ცარიელად** transactions update-ი (skills/appearances/languages sync)

---

## SECURITY REVIEW

- [ ] All endpoints `CompanyAccessGuard`-ით დაცული
- [ ] Cross-company access blocked
- [ ] Cover photo MIME + size validation
- [ ] Cover filename generated, not user-supplied
- [ ] Reference data validation (skill/appearance/language IDs must exist + active)
- [ ] Briefing length capped at 7500
- [ ] Skills/Appearance/Languages count capped
- [ ] No SQL injection — Prisma parameterized

---

## OUT OF SCOPE

- Shift entity + create shift from job (next batch)
- Shift management UI
- Admin panel for reference data management
- Job public URL (slug-based)
- Markdown briefing editor
- AI-powered briefing suggestions
- Skill autocomplete (free-text + suggested) — for now fixed list
- Multi-language briefing translations
- Job duplication / cloning UI
- Job templates library (predefined examples)

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-039: Locations entity removed in favor of inline address on JobPosting**
- Decision: Drop Location table entirely
- Reason: JobPosting is the natural "where work happens" concept; templates with addresses align with manager mental model
- Migration: dev DB destructive, no prod data

**ADR-040: Reference data via DB + seed (no enums)**
- Decision: JobSection/Category/Skill/Appearance/Language as DB tables, seeded
- Reason:
  - Localized (ka + en columns)
  - Growable (admin can add new)
  - Filterable per-context
- Alternative considered: Enums in code — rejected for localization

**ADR-041: 2-tier hierarchy (Section → Category)**
- Decision: Sections group categories
- Reason: UX scaling (50+ categories flat list overwhelming)
- Section examples: Hospitality, Retail, Logistics, etc.

**ADR-042: JobPosting as template, Shifts as instances**
- Decision: Job-Shift parent-child
- Reason: Manager creates template once, publishes shifts many times
- Future: Shifts will reference JobPosting

**ADR-043: Address autocomplete via external Python service**
- Decision: Frontend calls Python service directly (env-configured URL)
- Reason: 
  - Specialized address DB (Georgia-specific)
  - Backend doesn't proxy — simpler
- Production: address service URL via env, CORS configured

**ADR-044: Polymorphism rejected for requirements**
- Decision: Skill, Appearance, Language as separate tables
- Reason: 
  - Clear semantics
  - Independent sort orders
  - UI categories distinct
- Alternative: single JobRequirement table with `type` — rejected

---

## დასასრულს

- ყველა 15 acceptance criterion უნდა გავიდეს
- Seed-ი მუშაობს idempotent-ად
- Address autocomplete frontend-ი მუშაობს (assuming Python service running)
- ADR-39 to ADR-44 ჩაწერილი
- Commit: `feat: jobs — locations removal + reference data + JobPosting full stack (batch 3.0)`
- Tag: `v0.5.0`

---

## **შემაჩერე** თუ:
- Migration ცხადია destructive — confirm dev DB OK to lose
- Python autocomplete service URL/format-ი არ ხდები
- Seed data ცარიელად ცარიელად (categories list-ი მინდა override-ი)
- Reference data admin endpoints (out of scope, SQL-ით ჯერ)
- Markdown editor briefing-ისთვის (out of scope)
- Slug auto-generation JobPosting-ში (არ გვინდა)

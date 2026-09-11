import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  role: text().notNull(),
  salt: text().notNull(),
  passwordHash: text('password_hash').notNull(),
});
export const sessions = sqliteTable('sessions', {
  token: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expires: integer().notNull(),
});
export const attempts = sqliteTable('login_attempts', {
  email: text().primaryKey(),
  count: integer().notNull(),
  window: integer().notNull(),
});
export const patients = sqliteTable(
  'patients',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    document: text().notNull(),
    phone: text().notNull(),
    birthDate: text('birth_date').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('patients_document_unique').on(t.document)],
);
export const payers = sqliteTable('payers', {
  id: text().primaryKey(),
  name: text().notNull(),
  kind: text().notNull(),
});
export const patientPayers = sqliteTable(
  'patient_payers',
  {
    patientId: text('patient_id')
      .notNull()
      .references(() => patients.id),
    payerId: text('payer_id')
      .notNull()
      .references(() => payers.id),
  },
  (t) => [uniqueIndex('patient_payer_unique').on(t.patientId, t.payerId)],
);
export const professionals = sqliteTable('professionals', {
  id: text().primaryKey(),
  name: text().notNull(),
  specialty: text().notNull(),
});
export const appointments = sqliteTable(
  'appointments',
  {
    id: text().primaryKey(),
    patientId: text('patient_id')
      .notNull()
      .references(() => patients.id),
    payerId: text('payer_id')
      .notNull()
      .references(() => payers.id),
    professionalId: text('professional_id')
      .notNull()
      .references(() => professionals.id),
    date: text().notNull(),
    time: text().notNull(),
    duration: integer().notNull(),
    reason: text().notNull(),
    status: text().notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('appointments_schedule').on(t.professionalId, t.date, t.status),
  ],
);
export const audit = sqliteTable('audit', {
  id: text().primaryKey(),
  actor: text().notNull(),
  action: text().notNull(),
  entityId: text('entity_id').notNull(),
  detail: text().notNull(),
  createdAt: text('created_at').notNull(),
});
export const encounters = sqliteTable('encounters', {
  id: text().primaryKey(),
  appointmentId: text('appointment_id')
    .notNull()
    .unique()
    .references(() => appointments.id),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  author: text().notNull(),
  notes: text().notNull(),
  status: text().notNull(),
  version: integer().notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const encounterVersions = sqliteTable(
  'encounter_versions',
  {
    id: text().primaryKey(),
    encounterId: text('encounter_id')
      .notNull()
      .references(() => encounters.id),
    version: integer().notNull(),
    notes: text().notNull(),
    author: text().notNull(),
    reason: text().notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('encounter_version_unique').on(t.encounterId, t.version)],
);
export const quotes = sqliteTable('quotes', {
  id: text().primaryKey(),
  appointmentId: text('appointment_id')
    .notNull()
    .references(() => appointments.id),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  payerId: text('payer_id')
    .notNull()
    .references(() => payers.id),
  description: text().notNull(),
  totalCents: integer('total_cents').notNull(),
  status: text().notNull(),
  createdAt: text('created_at').notNull(),
});
export const sales = sqliteTable('sales', {
  id: text().primaryKey(),
  quoteId: text('quote_id')
    .notNull()
    .unique()
    .references(() => quotes.id),
  totalCents: integer('total_cents').notNull(),
  fiscalStatus: text('fiscal_status').notNull(),
  fiscalRef: text('fiscal_ref'),
  createdAt: text('created_at').notNull(),
});
export const payments = sqliteTable('payments', {
  id: text().primaryKey(),
  saleId: text('sale_id')
    .notNull()
    .references(() => sales.id),
  amountCents: integer('amount_cents').notNull(),
  currency: text().notNull(),
  rate: text().notNull(),
  usdCents: integer('usd_cents').notNull(),
  method: text().notNull(),
  reference: text().notNull(),
  createdAt: text('created_at').notNull(),
});

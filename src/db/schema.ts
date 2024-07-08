import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  pgEnum,
  serial,
  timestamp,
  integer,
  real,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const UserRole = pgEnum('userRole', ['Admin', 'Basic']);
export const AccountType = pgEnum('accountType', [
  'Bank',
  'Cash',
  'CreditCard',
]);
export const AccountState = pgEnum('accountSate', [
  'Active',
  'Inactive',
  'Closed',
]);
export const IncomeSource = pgEnum('incomeSource', [
  'Salary',
  'Interest',
  'Profit',
  'Other',
]);

export const UserTable = pgTable('user', {
  id: serial('id').primaryKey(),
  role: UserRole('role').default('Basic').notNull(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  email: varchar('email').notNull().unique(),
  salt: varchar('salt').notNull(),
  hash: varchar('hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const AccountTable = pgTable('account', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => UserTable.id)
    .notNull(),
  type: AccountType('type').notNull(),
  state: AccountState('state').default('Active').notNull(),
  name: varchar('name').notNull(),
  initialAmount: real('initial_amount').default(0.0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const TransferTable = pgTable('transfer', {
  id: serial('id').primaryKey(),
  fromAccountId: integer('from_account_id')
    .references(() => AccountTable.id)
    .notNull(),
  toAccountId: integer('to_account_id')
    .references(() => AccountTable.id)
    .notNull(),
  amount: real('amount').notNull(),
  date: timestamp('date').notNull(),
});

export const IncomeTable = pgTable('income', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .references(() => AccountTable.id)
    .notNull(),
  amount: real('amount').notNull(),
  date: timestamp('date').notNull(),
  source: IncomeSource('source').notNull(),
});

export const ExpenseCategoryTable = pgTable('expense_category', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  parentId: integer('parent_id').references(
    (): AnyPgColumn => ExpenseCategoryTable.id,
  ),
});

export const ExpenseTable = pgTable('expense', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => ExpenseCategoryTable.id)
    .notNull(),
  accountId: integer('account_id')
    .references(() => AccountTable.id)
    .notNull(),
  amount: real('amount').notNull(),
  date: timestamp('date').notNull(),
});

export const TransactionTable = pgTable('transaction', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .references(() => AccountTable.id)
    .notNull(),
  debit: real('debit').default(0.0).notNull(),
  credit: real('credit').default(0.0).notNull(),
  balance: real('balance').default(0.0).notNull(),
  date: timestamp('date').notNull(),
  description: varchar('description').notNull(),
});

// relations

export const UserTableRelations = relations(UserTable, ({ many }) => {
  return {
    accounts: many(AccountTable),
  };
});

export const AccountTableRelations = relations(AccountTable, ({ one }) => {
  return {
    account: one(UserTable, {
      fields: [AccountTable.userId],
      references: [UserTable.id],
    }),
  };
});

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { generatePassword } from '../utils';
import { AccountTable, ExpenseCategoryTable, UserTable } from './schema';

dotenv.config();

const client = postgres(process.env.DATABASE_URL as string);
export const db = drizzle(client, { schema, logger: true });

async function startSeeding() {
  console.log('seeding started...');

  const hashObj = generatePassword('admin123');

  const users = await db
    .insert(UserTable)
    .values({
      role: 'Admin',
      email: 'admin@test.com',
      firstName: 'Dipankar',
      lastName: 'Biswas',
      salt: hashObj.salt,
      hash: hashObj.hash,
    })
    .returning();

  await db
    .insert(AccountTable)
    .values({
      userId: users[0].id,
      type: 'Cash',
      state: 'Active',
      name: 'Cash',
      initialAmount: 0,
    })
    .returning();

  const expenseCategories = [
    {
      name: 'Food',
      children: [
        { name: 'Breakfast' },
        { name: 'Lunch' },
        { name: 'Dinner' },
        { name: 'Snack' },
        { name: 'Fruit' },
        { name: 'Ingredients' },
      ],
    },

    {
      name: 'Clothing/Beauty',
      children: [
        { name: 'Shirt' },
        { name: 'Pants' },
        { name: 'Jacket' },
        { name: 'Shoes' },
        { name: 'Bag' },
        { name: 'Accessories' },
        { name: 'Haircut' },
        { name: 'Cosmetics' },
      ],
    },
    {
      name: 'Living',
      children: [
        { name: 'Firniture' },
        { name: 'Appliances' },
        { name: 'Rent' },
        { name: 'Management Fees' },
        { name: 'Water' },
        { name: 'Electricity' },
        { name: 'Gas' },
        { name: 'Cable TV' },
        { name: 'Internet' },
      ],
    },
    {
      name: 'Transportation',
      children: [
        { name: 'Bus' },
        { name: 'Subway' },
        { name: 'Taxi' },
        { name: 'High Speed Rail' },
        { name: 'Airplane' },
      ],
    },
    {
      name: 'Education',
      children: [
        { name: 'Stationary' },
        { name: 'Tutoring Fee' },
        { name: 'Tution' },
      ],
    },
    {
      name: 'Entertainment',
      children: [
        { name: 'Mobile' },
        { name: 'Toys' },
        { name: 'Tarvel' },
        { name: 'Shopping' },
      ],
    },
    {
      name: 'Personal 3C',
      children: [
        { name: 'Telephone' },
        { name: 'PC Related' },
        { name: 'Cell Phone' },
        { name: 'Camera' },
      ],
    },
    {
      name: 'Publications',
      children: [
        { name: 'Books' },
        { name: 'Newspaper' },
        { name: 'Magazine' },
      ],
    },
    {
      name: 'Medical',
      children: [
        { name: 'Medical fee' },
        { name: 'Drugs' },
        { name: 'Physical Checkup' },
        { name: 'Health Insurance' },
      ],
    },
    {
      name: 'Social',
      children: [
        { name: 'Gifts' },
        { name: 'Social Activities' },
        { name: 'Wedding' },
        { name: 'Funeral' },
      ],
    },
    {
      name: 'Others',
      children: [
        { name: 'Pet' },
        { name: 'Lending Money' },
        { name: 'Charity' },
        { name: 'Incidental Expenses' },
      ],
    },
    { name: 'Fee', children: [{ name: 'Transfer Fee', parentId: 12 }] },
  ];

  for (let i = 0; i < expenseCategories.length; i++) {
    const cat = expenseCategories[i];
    const ids = await db
      .insert(ExpenseCategoryTable)
      .values({
        name: cat.name,
        parentId: null,
      })
      .returning({ id: ExpenseCategoryTable.id });

    const parentId = ids[0].id;

    for (let j = 0; j < cat.children.length; j++) {
      await db.insert(ExpenseCategoryTable).values({
        name: cat.children[j].name,
        parentId: parentId,
      });
    }
  }

  await client.end();
  console.log('seeding fnished...');
}

startSeeding();

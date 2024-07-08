import postgres from 'postgres';

import { and, desc, eq, or } from 'drizzle-orm';
import {
  AccountTable,
  ExpenseCategoryTable,
  ExpenseTable,
  IncomeTable,
  TransactionTable,
  TransferTable,
  UserTable,
  createDB,
} from './db';
import { alias } from 'drizzle-orm/pg-core';

type IncomeSourceType = 'Salary' | 'Interest' | 'Profit' | 'Other';
type AccountType = 'Bank' | 'Cash' | 'CreditCard';
type AccountState = 'Active' | 'Inactive' | 'Closed';
export type RoleType = 'Admin' | 'Basic';

type UserDto = {
  id: number;
  role: RoleType;
  email: string;
  firstName: string;
  lastName: string;
  salt: string;
  hash: string;
};

type CreateUserDto = {
  role: RoleType;
  email: string;
  firstName: string;
  lastName: string;
  salt: string;
  hash: string;
};

type AccountResponseDto = {
  id: number;
  name: string;
  type: string;
  state: string;
  initialAmount: number;
  currentBalance: number;
  createdAt: string;
};

type UserResponseDto = {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type IncomeResponseDto = {
  id: number;
  amount: number;
  date: string;
  source: string;
};

type ExpenseCategoryResponseDto = {
  id: number;
  name: string;
};

type ExpenseResponseDto = {
  id: number;
  amount: number;
  date: string;
};

type TransferResponseDto = {
  id: number;
  amount: number;
  date: string;
};

type TransactionResponseDto = {
  id: number;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  date: string;
};

type CreateExpenseRequestDto = {
  userId: number;
  categoryId: number;
  accountId: number;
  amount: number;
  date: Date;
};

type UpdateExpenseRequestDto = {
  id: number;
  userId: number;
  categoryId: number;
  accountId: number;
  amount: number;
  date: Date;
};

type DeleteExpenseRequestDto = {
  userId: number;
  expenseId: number;
};

type CreateIncomeRequestDto = {
  accountId: number;
  userId: number;
  amount: number;
  date: Date;
  source: string;
};

type DeleteIncomeRequestDto = {
  incomeId: number;
  userId: number;
};

type CreateAccountRequestDto = {
  userId: number;
  name: string;
  accountType: string;
  initialAmount: number;
};

type UpdateAccountRequestDto = {
  id: number;
  userId: number;
  name: string;
  accountType: string;
  accountState: string;
  initialAmount: number;
};

type CreateTransferRequestDto = {
  userId: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: Date;
};

type DeleteTransferRequestDto = {
  transferId: number;
  userId: number;
};

export class Repository {
  private readonly db;

  constructor(client: postgres.Sql) {
    this.db = createDB(client);
  }

  async getUserByEmail(email: string): Promise<UserDto | undefined> {
    const user = await this.db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    });

    return user;
  }

  async createUser(user: CreateUserDto): Promise<UserResponseDto> {
    const users = await this.db
      .insert(UserTable)
      .values({
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        salt: user.salt,
        hash: user.hash,
      })
      .returning({
        id: UserTable.id,
        role: UserTable.role,
        email: UserTable.email,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
        createdAt: UserTable.createdAt,
      });

    return { ...users[0], createdAt: users[0].createdAt.toISOString() };
  }

  async getCategories(): Promise<ExpenseCategoryResponseDto[]> {
    return await this.db.query.ExpenseCategoryTable.findMany();
  }

  async getCategory(catId: number): Promise<ExpenseCategoryResponseDto | null> {
    const cats = await this.db.query.ExpenseCategoryTable.findMany({
      where: eq(ExpenseCategoryTable.id, catId),
    });

    if (cats === null || (cats && cats.length === 0)) {
      return null;
    }

    return cats[0];
  }

  async getAccounts(userId: number): Promise<AccountResponseDto[]> {
    const accounts = await this.db.query.AccountTable.findMany({
      where: eq(AccountTable.userId, userId),
    });

    return await Promise.all(
      accounts.map(async (acc: any) => await this.mapAccountToResponseDto(acc)),
    );
  }

  async getAccount(
    userId: number,
    accountId: number,
  ): Promise<AccountResponseDto | null> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(AccountTable.userId, UserTable.id))
      .where(and(eq(UserTable.id, userId), eq(AccountTable.id, accountId)));

    if (accounts === null || (accounts && accounts.length === 0)) {
      return null;
    }

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getUserForAccount(accountId: number): Promise<UserResponseDto> {
    const users = await this.db
      .select({
        id: UserTable.id,
        role: UserTable.role,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
        email: UserTable.email,
        createdAt: UserTable.createdAt,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(AccountTable.userId, UserTable.id))
      .where(eq(AccountTable.id, accountId));

    let user = { ...users[0], createdAt: users[0].createdAt.toISOString() };
    return user;
  }

  async getIncomes(userId: number): Promise<IncomeResponseDto[]> {
    const incomes = await this.db
      .select({
        id: IncomeTable.id,
        amount: IncomeTable.amount,
        date: IncomeTable.date,
        source: IncomeTable.source,
      })
      .from(IncomeTable)
      .innerJoin(AccountTable, eq(AccountTable.id, IncomeTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(eq(UserTable.id, userId));

    return incomes.map((income) => {
      return {
        ...income,
        date: income.date.toISOString(),
      };
    });
  }

  async getIncome(
    userId: number,
    incomeId: number,
  ): Promise<IncomeResponseDto | null> {
    const incomes = await this.db
      .select({
        id: IncomeTable.id,
        amount: IncomeTable.amount,
        date: IncomeTable.date,
        source: IncomeTable.source,
      })
      .from(IncomeTable)
      .innerJoin(AccountTable, eq(AccountTable.id, IncomeTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(and(eq(UserTable.id, userId), eq(IncomeTable.id, incomeId)));

    if (incomes === null || (incomes && incomes.length === 0)) {
      return null;
    }

    return {
      ...incomes[0],
      date: incomes[0].date.toISOString(),
    };
  }

  async getExpenses(userId: number): Promise<ExpenseResponseDto[]> {
    const expenses = await this.db
      .select({
        id: ExpenseTable.id,
        amount: ExpenseTable.amount,
        date: ExpenseTable.date,
      })
      .from(ExpenseTable)
      .innerJoin(AccountTable, eq(AccountTable.id, ExpenseTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(eq(UserTable.id, userId));

    return expenses.map((exp) => {
      return { ...exp, date: exp.date.toISOString() };
    });
  }

  async getExpense(
    userId: number,
    expenseId: number,
  ): Promise<ExpenseResponseDto | null> {
    const expenses = await this.db
      .select({
        id: ExpenseTable.id,
        amount: ExpenseTable.amount,
        date: ExpenseTable.date,
      })
      .from(ExpenseTable)
      .innerJoin(AccountTable, eq(AccountTable.id, ExpenseTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(and(eq(UserTable.id, userId), eq(ExpenseTable.id, expenseId)));

    if (expenses === null || (expenses && expenses.length === 0)) {
      return null;
    }

    return { ...expenses[0], date: expenses[0].date.toISOString() };
  }

  async getTransfers(userId: number): Promise<TransferResponseDto[]> {
    const transfers = await this.db
      .select({
        id: TransferTable.id,
        amount: TransferTable.amount,
        date: TransferTable.date,
      })
      .from(TransferTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransferTable.fromAccountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(eq(UserTable.id, userId));

    return transfers.map((transfer) => {
      return {
        ...transfer,
        date: transfer.date.toISOString(),
      };
    });
  }

  async getTransfer(
    userId: number,
    transferId: number,
  ): Promise<TransferResponseDto | null> {
    const transfers = await this.db
      .select({
        id: TransferTable.id,
        amount: TransferTable.amount,
        date: TransferTable.date,
      })
      .from(TransferTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransferTable.fromAccountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(and(eq(UserTable.id, userId), eq(TransferTable.id, transferId)));

    if (transfers === null || (transfers && transfers.length === 0)) {
      return null;
    }

    return { ...transfers[0], date: transfers[0].date.toISOString() };
  }

  async getTransactions(userId: number): Promise<TransactionResponseDto[]> {
    const transactions = await this.db
      .select({
        id: TransactionTable.id,
        debit: TransactionTable.debit,
        credit: TransactionTable.credit,
        balance: TransactionTable.balance,
        description: TransactionTable.description,
        date: TransactionTable.date,
      })
      .from(TransactionTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransactionTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(eq(UserTable.id, userId));

    return transactions.map((transaction) => {
      return {
        ...transaction,
        date: transaction.date.toISOString(),
      };
    });
  }

  async getAccountForIncome(incomeId: number): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(IncomeTable)
      .innerJoin(AccountTable, eq(AccountTable.id, IncomeTable.accountId))
      .where(eq(IncomeTable.id, incomeId));

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getAccountForExpense(expenseId: number): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(ExpenseTable)
      .innerJoin(AccountTable, eq(AccountTable.id, ExpenseTable.accountId))
      .where(eq(ExpenseTable.id, expenseId));

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getAccountForTransaction(
    transactionId: number,
  ): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(TransactionTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransactionTable.accountId))
      .where(eq(TransactionTable.id, transactionId));

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getFromAccountForTransfer(
    transferId: number,
  ): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(TransferTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransferTable.fromAccountId))
      .where(eq(TransferTable.id, transferId));

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getToAccountForTransfer(
    transferId: number,
  ): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
        createdAt: AccountTable.createdAt,
      })
      .from(TransferTable)
      .innerJoin(AccountTable, eq(AccountTable.id, TransferTable.toAccountId))
      .where(eq(TransferTable.id, transferId));

    return await this.mapAccountToResponseDto(accounts[0]);
  }

  async getCategoryForExpense(
    expenseId: number,
  ): Promise<ExpenseCategoryResponseDto> {
    const categories = await this.db
      .select({
        id: ExpenseCategoryTable.id,
        name: ExpenseCategoryTable.name,
        parentId: ExpenseCategoryTable.parentId,
      })
      .from(ExpenseTable)
      .innerJoin(
        ExpenseCategoryTable,
        eq(ExpenseTable.categoryId, ExpenseCategoryTable.id),
      )
      .where(eq(ExpenseTable.id, expenseId));

    return categories[0];
  }

  async getParentForCategoryId(
    categoryId: number,
  ): Promise<ExpenseCategoryResponseDto> {
    const child = alias(ExpenseCategoryTable, 'child');
    const categories = await this.db
      .select({
        id: ExpenseCategoryTable.id,
        name: ExpenseCategoryTable.name,
      })
      .from(ExpenseCategoryTable)
      .innerJoin(child, eq(child.parentId, ExpenseCategoryTable.id))
      .where(eq(child.id, categoryId));

    return categories[0];
  }

  async createExpense(
    dto: CreateExpenseRequestDto,
  ): Promise<ExpenseResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(
        and(eq(UserTable.id, dto.userId), eq(AccountTable.id, dto.accountId)),
      );

    if (accounts.length === 0) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const expenses = await tx
        .insert(ExpenseTable)
        .values({
          categoryId: dto.categoryId,
          accountId: dto.accountId,
          amount: dto.amount,
          date: dto.date,
        })
        .returning();

      const balanceRow = await tx.query.TransactionTable.findFirst({
        columns: {
          balance: true,
        },
        where: eq(TransactionTable.accountId, dto.accountId),
        orderBy: [desc(TransactionTable.id)],
      });
      const balance = balanceRow?.balance || 0;

      await tx.insert(TransactionTable).values({
        accountId: dto.accountId,
        debit: dto.amount,
        credit: 0,
        balance: balance - dto.amount,
        date: new Date(),
        description: `New Expense - ${await this.getExpenseCategoryName(dto.categoryId)}`,
      });

      return {
        id: expenses[0].id,
        amount: expenses[0].amount,
        date: expenses[0].date.toISOString(),
      };
    });
  }

  async updateExpense(
    dto: UpdateExpenseRequestDto,
  ): Promise<ExpenseResponseDto> {
    const expenses = await this.db
      .select({
        id: ExpenseTable.id,
      })
      .from(ExpenseTable)
      .innerJoin(AccountTable, eq(AccountTable.id, ExpenseTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(and(eq(UserTable.id, dto.userId), eq(ExpenseTable.id, dto.id)));

    if (expenses.length === 0) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const expense = await tx.query.ExpenseTable.findFirst({
        where: eq(ExpenseTable.id, dto.id),
      });

      if (expense) {
        const lastTransactionRow = await tx.query.TransactionTable.findFirst({
          columns: {
            balance: true,
          },
          where: eq(TransactionTable.accountId, dto.accountId),
          orderBy: [desc(TransactionTable.id)],
        });
        const balance = lastTransactionRow?.balance || 0;

        await tx.insert(TransactionTable).values([
          {
            accountId: expense.accountId,
            debit: 0,
            credit: expense.amount,
            balance: balance + expense.amount,
            date: new Date(),
            description: `Delete Expense - ${await this.getExpenseCategoryName(expense.categoryId)}`,
          },
          {
            accountId: dto.accountId,
            debit: dto.amount,
            credit: 0,
            balance: balance + expense.amount - dto.amount,
            date: new Date(),
            description: `New Expense - ${await this.getExpenseCategoryName(dto.categoryId)}`,
          },
        ]);

        const updatedExpenses = await tx
          .update(ExpenseTable)
          .set({
            categoryId: dto.categoryId,
            accountId: dto.accountId,
            amount: dto.amount,
            date: dto.date,
          })
          .where(eq(ExpenseTable.id, dto.id))
          .returning();

        return {
          id: updatedExpenses[0].id,
          amount: updatedExpenses[0].amount,
          date: updatedExpenses[0].date.toISOString(),
        };
      } else {
        throw new Error('Expense not found');
      }
    });
  }

  async deleteExpense(dto: DeleteExpenseRequestDto): Promise<boolean> {
    const expenses = await this.db
      .select({
        id: ExpenseTable.id,
      })
      .from(ExpenseTable)
      .innerJoin(AccountTable, eq(AccountTable.id, ExpenseTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(
        and(eq(UserTable.id, dto.userId), eq(ExpenseTable.id, dto.expenseId)),
      );

    if (expenses.length === 0) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const deletedExpenses = await tx
        .delete(ExpenseTable)
        .where(eq(ExpenseTable.id, dto.expenseId))
        .returning();

      if (deletedExpenses && deletedExpenses.length > 0) {
        const expense = deletedExpenses[0];

        const lastRow = await tx.query.TransactionTable.findFirst({
          columns: {
            balance: true,
          },
          where: eq(TransactionTable.accountId, expense.accountId),
          orderBy: [desc(TransactionTable.id)],
        });
        const balance = lastRow?.balance || 0;

        await tx.insert(TransactionTable).values({
          accountId: expense.accountId,
          debit: 0,
          credit: expense.amount,
          balance: balance + expense.amount,
          date: new Date(),
          description: `Deleted Expense - ${await this.getExpenseCategoryName(expense.categoryId)}`,
        });

        return true;
      }

      return false;
    });
  }

  async createIncome(dto: CreateIncomeRequestDto): Promise<IncomeResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(
        and(eq(UserTable.id, dto.userId), eq(AccountTable.id, dto.accountId)),
      );

    if (accounts.length === 0) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const incomes = await tx
        .insert(IncomeTable)
        .values({
          accountId: dto.accountId,
          amount: dto.amount,
          date: dto.date,
          source: dto.source as IncomeSourceType,
        })
        .returning();

      const balanceRow = await tx.query.TransactionTable.findFirst({
        columns: {
          balance: true,
        },
        where: eq(TransactionTable.accountId, dto.accountId),
        orderBy: [desc(TransactionTable.id)],
      });
      const balance = balanceRow?.balance || 0;

      await tx.insert(TransactionTable).values({
        accountId: dto.accountId,
        debit: 0,
        credit: dto.amount,
        balance: balance + dto.amount,
        date: new Date(),
        description: `New Income - ${dto.source} to account ${dto.accountId}`,
      });

      return {
        id: incomes[0].id,
        amount: incomes[0].amount,
        source: incomes[0].source,
        date: incomes[0].date.toISOString(),
      };
    });
  }

  async deleteIncome(dto: DeleteIncomeRequestDto): Promise<boolean> {
    const incomes = await this.db
      .select({
        id: IncomeTable.id,
      })
      .from(IncomeTable)
      .innerJoin(AccountTable, eq(AccountTable.id, IncomeTable.accountId))
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(
        and(eq(UserTable.id, dto.userId), eq(IncomeTable.id, dto.incomeId)),
      );

    if (incomes.length === 0) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const deletedIncomes = await tx
        .delete(IncomeTable)
        .where(eq(IncomeTable.id, dto.incomeId))
        .returning();

      if (deletedIncomes && deletedIncomes.length > 0) {
        const income = deletedIncomes[0];

        const lastRow = await tx.query.TransactionTable.findFirst({
          columns: {
            balance: true,
          },
          where: eq(TransactionTable.accountId, income.accountId),
          orderBy: [desc(TransactionTable.id)],
        });
        const balance = lastRow?.balance || 0;

        await tx.insert(TransactionTable).values({
          accountId: income.accountId,
          debit: income.amount,
          credit: 0,
          balance: balance - income.amount,
          date: new Date(),
          description: `Delete Income - ${income.source} to account ${income.accountId}`,
        });

        return true;
      }

      return false;
    });
  }

  async createAccount(
    dto: CreateAccountRequestDto,
  ): Promise<AccountResponseDto> {
    return await this.db.transaction(async (tx) => {
      const accounts = await tx
        .insert(AccountTable)
        .values({
          userId: dto.userId,
          type: dto.accountType as AccountType,
          state: 'Active',
          name: dto.name,
          initialAmount: dto.initialAmount,
          createdAt: new Date(),
        })
        .returning();

      const lastRow = await tx.query.TransactionTable.findFirst({
        columns: {
          balance: true,
        },
        where: eq(TransactionTable.accountId, accounts[0].id),
        orderBy: [desc(TransactionTable.id)],
      });
      const balance = lastRow?.balance || 0;

      await tx.insert(TransactionTable).values({
        accountId: accounts[0].id,
        debit: 0,
        credit: dto.initialAmount,
        balance: balance + dto.initialAmount,
        date: new Date(),
        description: 'Account Creation',
      });

      return await this.mapAccountToResponseDto(accounts[0]);
    });
  }

  async updateAccount(
    dto: UpdateAccountRequestDto,
  ): Promise<AccountResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
        name: AccountTable.name,
        type: AccountTable.type,
        state: AccountTable.state,
        initialAmount: AccountTable.initialAmount,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(AccountTable.userId, UserTable.id))
      .where(and(eq(UserTable.id, dto.userId), eq(AccountTable.id, dto.id)));

    if (accounts === null || (accounts && accounts.length === 0)) {
      throw new Error('Unauthorized');
    }

    const account = accounts[0];

    return await this.db.transaction(async (tx) => {
      if (account) {
        if (account.initialAmount !== dto.initialAmount) {
          const transcationLastRow = await tx.query.TransactionTable.findFirst({
            columns: {
              balance: true,
            },
            where: eq(TransactionTable.accountId, account.id),
            orderBy: [desc(TransactionTable.id)],
          });
          const balance = transcationLastRow?.balance || 0;

          await tx.insert(TransactionTable).values([
            {
              accountId: account.id,
              debit: account.initialAmount,
              credit: 0,
              balance: balance - account.initialAmount,
              date: new Date(),
              description: 'Account Update',
            },
            {
              accountId: account.id,
              debit: 0,
              credit: dto.initialAmount,
              balance: balance - account.initialAmount + dto.initialAmount,
              date: new Date(),
              description: 'Account Update',
            },
          ]);
        }

        const updatedAccounts = await tx
          .update(AccountTable)
          .set({
            id: dto.id,
            name: dto.name,
            type: dto.accountType as AccountType,
            state: dto.accountState as AccountState,
            initialAmount: dto.initialAmount,
          })
          .where(eq(AccountTable.id, dto.id))
          .returning();

        return await this.mapAccountToResponseDto(updatedAccounts[0]);
      }

      throw new Error('Account not found');
    });
  }

  async createTransfer(
    dto: CreateTransferRequestDto,
  ): Promise<TransferResponseDto> {
    const accounts = await this.db
      .select({
        id: AccountTable.id,
      })
      .from(AccountTable)
      .innerJoin(UserTable, eq(UserTable.id, AccountTable.userId))
      .where(
        and(
          eq(UserTable.id, dto.userId),
          or(
            eq(AccountTable.id, dto.fromAccountId),
            eq(AccountTable.id, dto.toAccountId),
          ),
        ),
      );

    if (accounts.length < 2) {
      throw new Error('Unauthorized');
    }

    return await this.db.transaction(async (tx) => {
      const transfers = await tx
        .insert(TransferTable)
        .values({
          fromAccountId: dto.fromAccountId,
          toAccountId: dto.toAccountId,
          amount: dto.amount,
          date: dto.date,
        })
        .returning();

      const balanceRow1 = await tx.query.TransactionTable.findFirst({
        columns: {
          balance: true,
        },
        where: eq(TransactionTable.accountId, dto.fromAccountId),
        orderBy: [desc(TransactionTable.id)],
      });
      const balance1 = balanceRow1?.balance || 0;

      await tx.insert(TransactionTable).values({
        accountId: dto.fromAccountId,
        debit: dto.amount,
        credit: 0,
        balance: balance1 - dto.amount,
        date: new Date(),
        description: `New Transfer - Transaction from account ${dto.fromAccountId}`,
      });

      const balanceRow2 = await tx.query.TransactionTable.findFirst({
        columns: {
          balance: true,
        },
        where: eq(TransactionTable.accountId, dto.toAccountId),
        orderBy: [desc(TransactionTable.id)],
      });
      const balance2 = balanceRow2?.balance || 0;

      await tx.insert(TransactionTable).values({
        accountId: dto.toAccountId,
        debit: 0,
        credit: dto.amount,
        balance: balance2 + dto.amount,
        date: new Date(),
        description: `New Transfer - Transaction to account ${dto.toAccountId}`,
      });

      return {
        ...transfers[0],
        date: transfers[0].date.toISOString(),
      };
    });
  }

  async deleteTransfer(dto: DeleteTransferRequestDto): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      const deletedTransfers = await tx
        .delete(TransferTable)
        .where(eq(TransferTable.id, dto.transferId))
        .returning();

      if (deletedTransfers && deletedTransfers.length > 0) {
        const transfer = deletedTransfers[0];

        const lastRow1 = await tx.query.TransactionTable.findFirst({
          columns: {
            balance: true,
          },
          where: eq(TransactionTable.accountId, transfer.fromAccountId),
          orderBy: [desc(TransactionTable.id)],
        });
        const balance1 = lastRow1?.balance || 0;

        await tx.insert(TransactionTable).values({
          accountId: transfer.fromAccountId,
          debit: 0,
          credit: transfer.amount,
          balance: balance1 + transfer.amount,
          date: new Date(),
          description: `Delete Transfer - Transaction from account ${transfer.fromAccountId}`,
        });

        const lastRow2 = await tx.query.TransactionTable.findFirst({
          columns: {
            balance: true,
          },
          where: eq(TransactionTable.accountId, transfer.toAccountId),
          orderBy: [desc(TransactionTable.id)],
        });
        const balance2 = lastRow2?.balance || 0;

        await tx.insert(TransactionTable).values({
          accountId: transfer.toAccountId,
          debit: transfer.amount,
          credit: 0,
          balance: balance2 - transfer.amount,
          date: new Date(),
          description: `Delete Transfer - Transaction to account ${transfer.toAccountId}`,
        });

        return true;
      }

      return false;
    });
  }

  private async mapAccountToResponseDto(
    account: any,
  ): Promise<AccountResponseDto> {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      state: account.state,
      initialAmount: account.initialAmount,
      createdAt: account.createdAt.toISOString(),
      currentBalance: await this.getAccountBalance(account.id),
    };
  }

  private async getAccountBalance(id: number): Promise<number> {
    const transactionlastRow = await this.db.query.TransactionTable.findFirst({
      columns: {
        balance: true,
      },
      where: eq(TransactionTable.accountId, id),
      orderBy: [desc(TransactionTable.id)],
    });

    return transactionlastRow?.balance || 0;
  }

  private async getExpenseCategoryName(categoryId: number): Promise<string> {
    const categories = await this.db.query.ExpenseCategoryTable.findMany();

    const expenseCaterory = categories.find(
      (cat: any) => cat.id === categoryId,
    );

    if (expenseCaterory === undefined) return 'Unknown';

    if (expenseCaterory.parentId) {
      return (
        (await this.getExpenseCategoryName(expenseCaterory.parentId)) +
        '/' +
        expenseCaterory.name
      );
    }

    return expenseCaterory.name;
  }
}

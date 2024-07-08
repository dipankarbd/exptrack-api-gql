import { AppContext } from '../types';
import type { IResolvers } from '@graphql-tools/utils';

interface GetAccountArgs {
  id: number;
}

interface GetIncomeArgs {
  id: number;
}

interface GetExpenseArgs {
  id: number;
}

interface GetTransferArgs {
  id: number;
}

interface GetCategoryArgs {
  id: number;
}

interface AddExpenseArgs {
  input: {
    amount: number;
    date: string;
    categoryId: number;
    accountId: number;
  };
}

interface DeleteExpenseArgs {
  id: number;
}

interface UpdateExpenseArgs {
  input: {
    id: number;
    amount: number;
    date: string;
    categoryId: number;
    accountId: number;
  };
}

interface AddIncomeArgs {
  input: {
    amount: number;
    date: string;
    source: string;
    accountId: number;
  };
}

interface DeleteIncomeArgs {
  id: number;
}

interface AddAccountArgs {
  input: {
    name: string;
    type: string;
    initialAmount: number;
  };
}

interface UpdateAccountArgs {
  input: {
    id: number;
    name: string;
    type: string;
    state: string;
    initialAmount: number;
  };
}

interface AddTransferArgs {
  input: {
    amount: number;
    date: string;
    fromAccountId: number;
    toAccountId: number;
  };
}

interface DeleteTransferArgs {
  id: number;
}

export const resolvers: IResolvers<any, AppContext> = {
  Account: {
    user: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getUserForAccount(id),
  },
  Income: {
    account: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getAccountForIncome(id),
  },
  Expense: {
    account: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getAccountForExpense(id),
    category: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getCategoryForExpense(id),
  },
  ExpenseCategory: {
    parent: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getParentForCategoryId(id),
  },
  Transfer: {
    fromAccount: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getFromAccountForTransfer(id),
    toAccount: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getToAccountForTransfer(id),
  },
  Transaction: {
    account: ({ id }: { id: number }, _args: any, { repository }) =>
      repository.getAccountForTransaction(id),
  },
  Query: {
    expenseCategories: async (_, _args: any, { repository }) => {
      return await repository.getCategories();
    },
    expenseCategory: async (_, { id }: GetCategoryArgs, { repository }) => {
      return await repository.getCategory(id);
    },
    accounts: async (_, _args: any, { userId, repository }) => {
      return await repository.getAccounts(userId);
    },
    account: async (_, { id }: GetAccountArgs, { userId, repository }) => {
      return await repository.getAccount(userId, id);
    },
    incomes: async (_, _args: any, { userId, repository }) => {
      return await repository.getIncomes(userId);
    },
    income: async (_, { id }: GetIncomeArgs, { userId, repository }) => {
      return await repository.getIncome(userId, id);
    },
    expenses: async (_, _args: any, { userId, repository }) => {
      return await repository.getExpenses(userId);
    },
    expense: async (_, { id }: GetExpenseArgs, { userId, repository }) => {
      return await repository.getExpense(userId, id);
    },
    transfers: async (_, _args: any, { userId, repository }) => {
      return await repository.getTransfers(userId);
    },
    transfer: async (_, { id }: GetTransferArgs, { userId, repository }) => {
      return await repository.getTransfer(userId, id);
    },
    transactions: async (_, _args: any, { userId, repository }) => {
      return await repository.getTransactions(userId);
    },
  },
  Mutation: {
    addExpense: async (
      _,
      { input }: AddExpenseArgs,
      { userId, repository },
    ) => {
      return await repository.createExpense({
        userId: userId,
        ...input,
        date: new Date(input.date),
      });
    },
    updateExpense: async (
      _,
      { input }: UpdateExpenseArgs,
      { userId, repository },
    ) => {
      return await repository.updateExpense({
        userId: userId,
        ...input,
        date: new Date(input.date),
      });
    },
    deleteExpense: async (
      _,
      { id }: DeleteExpenseArgs,
      { userId, repository },
    ) => {
      return await repository.deleteExpense({
        userId: userId,
        expenseId: id,
      });
    },
    addIncome: async (_, { input }: AddIncomeArgs, { userId, repository }) => {
      return await repository.createIncome({
        userId: userId,
        ...input,
        date: new Date(input.date),
      });
    },
    deleteIncome: async (
      _,
      { id }: DeleteIncomeArgs,
      { userId, repository },
    ) => {
      return await repository.deleteIncome({
        userId: userId,
        incomeId: id,
      });
    },
    addAccount: async (
      _,
      { input }: AddAccountArgs,
      { userId, repository },
    ) => {
      return await repository.createAccount({
        userId: userId,
        ...input,
        accountType: input.type,
      });
    },
    updateAccount: async (
      _,
      { input }: UpdateAccountArgs,
      { userId, repository },
    ) => {
      return await repository.updateAccount({
        userId: userId,
        ...input,
        accountType: input.type,
        accountState: input.state,
      });
    },
    addTransfer: async (
      _,
      { input }: AddTransferArgs,
      { userId, repository },
    ) => {
      return await repository.createTransfer({
        userId: userId,
        ...input,
        date: new Date(input.date),
      });
    },
    deleteTransfer: async (
      _,
      { id }: DeleteTransferArgs,
      { userId, repository },
    ) => {
      return await repository.deleteTransfer({
        userId: userId,
        transferId: id,
      });
    },
  },
};

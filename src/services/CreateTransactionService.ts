// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    // não deixa criar uma categoria caso não haja balance
    if (type === 'outcome' && total < value) {
      throw new AppError('You enought have balance');
    }

    // verificar se categoria já existe
    // existe? buscar ela do banco de dados, e usar o id que foi retornado
    let transactionCategoy = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // não existe? cria ela
    if (!transactionCategoy) {
      transactionCategoy = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategoy);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategoy,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

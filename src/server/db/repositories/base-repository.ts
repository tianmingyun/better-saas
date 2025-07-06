import { DatabaseError } from '../types';

// Base Repository interface
export interface IBaseRepository<TSelect, TInsert> {
  findById(id: string): Promise<TSelect | undefined>;
  findAll(): Promise<TSelect[]>;
  create(data: TInsert): Promise<TSelect>;
  update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}

// Base Repository abstract class
export abstract class BaseRepository<TSelect, TInsert>
  implements IBaseRepository<TSelect, TInsert>
{
  abstract findById(id: string): Promise<TSelect | undefined>;
  abstract findAll(): Promise<TSelect[]>;
  abstract create(data: TInsert): Promise<TSelect>;
  abstract update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined>;
  abstract delete(id: string): Promise<boolean>;
  abstract exists(id: string): Promise<boolean>;
  abstract count(): Promise<number>;

  protected handleError(error: unknown, operation: string, code: string): never {
    const message = error instanceof Error ? error.message : '未知错误';
    throw new DatabaseError(`${operation}失败: ${message}`, code);
  }
}

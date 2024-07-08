import { Repository } from './repository';

export interface AppContext {
  userId: number;
  repository: Repository;
}

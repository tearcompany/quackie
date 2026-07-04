import { RewriteRequest } from './types';

export interface RewriteService {
  rewrite(request: RewriteRequest): Promise<string>;
}

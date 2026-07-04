import { Configuration } from '../config/Configuration';
import { RewriteService } from './RewriteService';
import { RewriteRequest } from './types';

export class RewriteServiceRouter implements RewriteService {
  constructor(
    private readonly configuration: Configuration,
    private readonly mockService: RewriteService,
    private readonly quackieService: RewriteService,
  ) {}

  rewrite(request: RewriteRequest): Promise<string> {
    const engine = this.configuration.getRewriteEngine();

    if (engine === 'quackie') {
      return this.quackieService.rewrite(request);
    }

    return this.mockService.rewrite(request);
  }
}

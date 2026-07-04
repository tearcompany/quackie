export type RewriteTargetType =
  | 'commit'
  | 'pull-request'
  | 'code-review'
  | 'release-notes'
  | 'branch-name'
  | 'changelog';

export interface RewriteRequest {
  persona: string;
  type: RewriteTargetType;
  text: string;
}

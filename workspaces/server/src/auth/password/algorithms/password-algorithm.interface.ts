export interface PasswordAlgorithm {
  id: string;
  matches(phc: string): boolean;
  hash(plain: string): Promise<string>;
  verify(plain: string, phc: string): Promise<boolean>;
  outdated(phc: string): boolean;
}

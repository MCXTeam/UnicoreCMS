import 'typeorm';

declare module 'typeorm' {
  interface RelationOptions {
    primary?: boolean;
  }
}

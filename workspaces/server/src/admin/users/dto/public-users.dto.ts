export class PublicUsersDto {
  items: string[];

  total: number;

  constructor(partial: Partial<PublicUsersDto>) {
    Object.assign(this, partial);
  }
}

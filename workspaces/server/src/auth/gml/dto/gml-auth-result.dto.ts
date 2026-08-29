export class GmlAuthResultDto {
  Login: string;

  UserUuid: string;

  IsSlim: boolean;

  constructor(partial: Partial<GmlAuthResultDto>) {
    Object.assign(this, partial);
  }
}

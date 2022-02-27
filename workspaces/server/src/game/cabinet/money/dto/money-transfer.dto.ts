import { Exclude, Type } from 'class-transformer';
import { UserProtectedDto } from 'src/admin/users/dto/user-protected.dto';
import { Money } from '../entities/money.entity';


export class MoneyTransferDto {
  get user() {
    return this.data[0];
  }

  @Type(() => UserProtectedDto)
  get target() {
    return this.data[1];
  }

  @Exclude()
  data: Money[]

  /**
   * 
   * @param partial Pass [User, Target]
   */
  constructor(partial: { data: Money[] }) {
    Object.assign(this, partial);
  }
}

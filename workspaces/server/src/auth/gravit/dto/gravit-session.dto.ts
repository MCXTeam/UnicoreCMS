import { GravitUserDto } from './gravit-user.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { instanceToPlain } from 'class-transformer';

export class GravitSessionDto {
  id: string;
  user: GravitUserDto;
  accessToken: string;
  expireIn: number;

  expire: number;
  hardwareId: string | null;
  userHardware: Record<string, unknown> | null;

  constructor(user: User, sessionId: string, hardware: Record<string, any> | null = null) {
    this.id = sessionId;
    this.expireIn = 0;
    this.expire = 0;
    this.hardwareId = hardware?.id || null;
    this.userHardware = hardware;
    this.user = instanceToPlain(new GravitUserDto(user)) as GravitUserDto;
    this.accessToken=this.user.accessToken;
  }
}

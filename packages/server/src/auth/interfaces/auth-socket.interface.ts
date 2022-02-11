import { Socket } from 'socket.io';
import { User } from 'src/admin/users/entities/user.entity';

export interface AuthSocket extends Socket { 
  user?: User;
}
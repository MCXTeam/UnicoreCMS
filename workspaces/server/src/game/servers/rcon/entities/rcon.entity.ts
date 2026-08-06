import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { encryptedColumn, ENCRYPTED_RCON_PASSWORD } from '@common';
import { Server } from '../../entities/server.entity';

@Entity({ name: 'unicore_rcons' })
export class RCON {
  @Column({ name: 'host' })
  host: string;

  @Column({ name: 'port' })
  port: number;

  @Exclude()
  @Column({ name: 'password', type: 'text', transformer: encryptedColumn(ENCRYPTED_RCON_PASSWORD) })
  password: string;

  @PrimaryColumn({ name: 'server_id' })
  serverId: string;

  @OneToOne(() => Server, (server) => server.rcon, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;
}

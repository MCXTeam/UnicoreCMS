import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import type { HardwareInfo } from '../hardware-comparison';

@Entity('unicore_hardware_registry')
export class HardwareRegistry {
  @PrimaryColumn({ length: 16 }) id: string;
}

@Entity('unicore_hardware_devices')
export class HardwareDevice {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column({ type: 'simple-json' }) info: HardwareInfo;
  @Column({ default: 1 }) revision: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('unicore_hardware_keys')
export class HardwareKey {
  @PrimaryColumn({ length: 64 }) hash: string;
  @Column({ length: 36 }) deviceId: string;
  @ManyToOne(() => HardwareDevice, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'device_id' }) device: HardwareDevice;
  @Column({ type: 'text' }) publicKey: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity('unicore_hardware_users')
export class HardwareUser {
  @PrimaryColumn({ length: 36 }) deviceId: string;
  @PrimaryColumn({ length: 36 }) userUuid: string;
  @ManyToOne(() => HardwareDevice, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'device_id' }) device: HardwareDevice;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_uuid' }) user: User;
  @CreateDateColumn() firstSeenAt: Date;
  @UpdateDateColumn() lastSeenAt: Date;
}

@Entity('unicore_hardware_sessions')
export class HardwareSession {
  @PrimaryColumn({ type: 'int' }) tokenId: number;
  @OneToOne(() => RefreshToken, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'token_id' }) token: RefreshToken;
  @Column({ default: false }) required: boolean;
  @Column({ type: 'text', nullable: true }) minecraftAccessToken: string | null;
  @Column({ length: 36, nullable: true }) deviceId: string | null;
  @ManyToOne(() => HardwareDevice, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'device_id' }) device: HardwareDevice;
}

@Entity('unicore_hardware_joins')
export class HardwareJoin {
  @PrimaryColumn({ length: 36 }) userUuid: string;
  @PrimaryColumn({ length: 128 }) serverId: string;
  @Column({ type: 'int' }) tokenId: number;
  @ManyToOne(() => RefreshToken, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'token_id' }) token: RefreshToken;
  @Column({ type: 'datetime' }) expiresAt: Date;
}

@Entity('unicore_hardware_bans')
@Index(['deviceId', 'revokedAt'])
export class HardwareBan {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column({ length: 36 }) deviceId: string;
  @ManyToOne(() => HardwareDevice, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'device_id' }) device: HardwareDevice;
  @Column({ type: 'text' }) reason: string;
  @Column({ length: 36, nullable: true }) actorUuid: string | null;
  @CreateDateColumn() issuedAt: Date;
  @Column({ type: 'datetime', nullable: true }) expiresAt: Date | null;
  @Column({ type: 'datetime', nullable: true }) revokedAt: Date | null;
  @Column({ length: 36, nullable: true }) revokedByUuid: string | null;
  @Column({ type: 'text', nullable: true }) revokeReason: string | null;
}

import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface PunishmentMember { streamId: string; providerId: string; primaryKinds: string[] }
export interface UnbanRule { enabled: boolean | null; price: number | null }

@Entity({ name: 'unicore_punishment_groups' })
export class PunishmentGroup {
  @PrimaryColumn({ length: 64 }) id: string;
  @Column({ length: 128 }) name: string;
  @Column({ type: 'simple-json' }) kinds: string[];
  @Column({ type: 'simple-json' }) members: PunishmentMember[];
  @Column({ type: 'simple-json' }) unban: UnbanRule;
  @Column({ default: true }) enabled: boolean;
  @Column({ default: 1 }) revision: number;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity({ name: 'unicore_punishment_settings' })
export class PunishmentSettings {
  @PrimaryColumn({ length: 16 }) id: string;
  @Column({ default: false }) gameUnbanEnabled: boolean;
  @Column({ type: 'decimal', precision: 16, scale: 4, default: 150, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) gameUnbanPrice: number;
  @Column({ type: 'simple-json' }) servers: Record<string, UnbanRule>;
}

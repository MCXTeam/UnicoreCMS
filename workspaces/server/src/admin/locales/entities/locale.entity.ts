import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'unicore_locales',
  orderBy: {
    priority: 'ASC',
  },
})
export class Locale {
  @PrimaryColumn({ name: 'code' })
  code: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @Column({ name: 'is_default', default: false })
  is_default: boolean;

  @Column({ name: 'priority', default: 0 })
  priority: number;
}

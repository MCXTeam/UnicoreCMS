import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { DonateGroup } from './donate-group.entity';

@Entity({
  orderBy: {
    priority: "ASC"
  }
})
export class GroupFeature {
	@PrimaryColumn()
  priority: number;

	@Column({ nullable: true })
	title?: string;

	@Column({ nullable: true })
	description?: string;

	@ManyToOne(() => DonateGroup, {
		cascade: true,
		primary: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		orphanedRowAction: 'delete',
		nullable: false,
	})
	@JoinColumn()
	group: DonateGroup;
}

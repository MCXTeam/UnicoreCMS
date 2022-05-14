import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { DonateGroup } from './donate-group.entity';

@Entity({
	name: "unicore_group_features",
  orderBy: {
    priority: "ASC"
  }
})
export class GroupFeature {
	@PrimaryColumn({ name: "priority" })
  priority: number;

	@Column({ nullable: true, name: "title" })
	title?: string;

	@Column({ nullable: true, name: "description" })
	description?: string;

	@ManyToOne(() => DonateGroup, {
		cascade: true,
		primary: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		orphanedRowAction: 'delete',
		nullable: false,
	})
	@JoinColumn({ name: "group_id" })
	group: DonateGroup;
}

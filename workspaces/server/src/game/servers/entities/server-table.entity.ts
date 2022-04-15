import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity({
  orderBy: {
    priority: "ASC"
  }
})
export class ServerTable {
  @PrimaryColumn()
  priority?: number;

	@Column({ nullable: true })
	title?: string;

	@Column({ nullable: true })
	description?: string;

	@ManyToOne(() => Server, {
    primary: true,
		cascade: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		orphanedRowAction: 'delete',
		nullable: false,
	})
	@JoinColumn()
	server: Server;
}

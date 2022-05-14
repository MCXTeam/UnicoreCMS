import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity({
	name: "unicore_server_tables",
  orderBy: {
    priority: "ASC"
  }
})
export class ServerTable {
  @PrimaryColumn({ name: "priority" })
  priority?: number;

	@Column({ nullable: true, name: "title" })
	title?: string;

	@Column({ nullable: true, name: "description" })
	description?: string;

	@ManyToOne(() => Server, {
    primary: true,
		cascade: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		orphanedRowAction: 'delete',
		nullable: false,
	})
	@JoinColumn({ name: "server_id" })
	server: Server;
}

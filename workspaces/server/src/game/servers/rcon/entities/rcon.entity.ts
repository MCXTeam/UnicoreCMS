import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Server } from "../../entities/server.entity";

@Entity()
export class RCON {
    @Column()
    host: string;

    @Column()
    port: number;

    @Column()
    password: string;

    @OneToOne(() => Server, (server) => server.rcon, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primary: true,
    })
    @JoinColumn()
    server: Server;
}
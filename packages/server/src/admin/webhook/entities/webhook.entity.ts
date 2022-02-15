import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { WebhookRequestType } from "../enums/webhook-request-type";
import { WebhookType } from "../enums/webhook-type.enum";

@Entity()
export class Webhook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: WebhookType;

  @Column()
  request: WebhookRequestType;

  @Column()
  url: string;
}
import { Injectable } from '@nestjs/common';
import { PunishmentViews, PunishmentListQuery } from '../../punishments/punishment-views.service';

@Injectable()
export class BanListService {
  constructor(private views: PunishmentViews) {}

  find(query: PunishmentListQuery) { return this.views.list({ ...query, kind: 'BAN' }); }
}

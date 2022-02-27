export interface RecordsOnlineInterface {
  today: RecordOnlineInterface;

  absolute: RecordOnlineInterface;
}

export interface RecordOnlineInterface {
  online: number;

  created: Date;
}

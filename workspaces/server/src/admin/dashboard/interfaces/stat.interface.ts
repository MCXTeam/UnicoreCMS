export interface StatGroup {
  date: Date;
  count?: number;
  amount?: number;
}

export interface StatInterface {
  days: StatGroup[];
  months: StatGroup[];
  count?: number;
  amount?: number;
  date?: Date;
}

export abstract class MonitoringCoreService {
  abstract handler(input: any): Promise<any>
}
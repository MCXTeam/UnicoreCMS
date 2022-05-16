import { Logger, MiddlewareConsumer, Module, NestModule, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import * as fs from "fs"
import * as crypto from "crypto"
import LicenseParser from "./license-parser";
import { envConfig } from "unicore-common";
import { Request, Response, NextFunction } from 'express';

const publicKey = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUF3MDVORjFZblhVYTJpdWtzNEYwcApOM1h4ZjlOdEJQbzZIeXZUNzFpRjFmMlZDaW1tUXFvTmQ4cEdFQlV3VHJKVVcxQ0tkWmovZ1BsaiszN1pLTkJuClFSNFdaVjM1N2ZZNkdTM0pGdVhrNFRZVCs0UUFIcnNtMVF6UjhveVd2aTZKTi9oUzJQemw1VTdMY21mbzUvdDkKa2cxOFZHUDJRRzR5eWQ2amdhL3JXdVJ5a1pDd0FpcnpXb01sUEVMUm9WUkdFS1hQODRUY2pNbEdNWUFRMVNmNQpXOGIrVnU2a1hJcFFMQkhRK2trV1UreEpvYUl5MUlTelA2ckJjcjVJejBNaTl4SE83WlVITEl2WUlNNFVXRVp5ClFFTnMwZ0N0em93VldKMkptVzJ2dmxkUHpCcHdTWlNMUEF5VEtTeXpuMDVrZDY1aFRybnJ4eHlvQ0dqRzZqNkYKbTBDUTQwdFF3bkxKOGo1Z2g5TlQxQk9xbnBDT00rTUoxVVJNVHhiU0o3Q1EzdXdaYlVCNTA5OFZWOEpTdW9GUApBR1BXYnM1a0c1bjRYODUxUGs0bjJ6TWpCOEdaWnFOZmRtZjVSNGMyZTVnK0JzeEppYVZGUUZSS25Ub0VIcFgzCkVDUVFoVUpDaDBxcjlsSTZmdjNxQ2x6WFZaa2VWY1o4cUlsYlVqWGpvcnY1cWgwK2pLK2wvMEovcUhlNWczQTkKWGxlZThoRU8wTEMwL09IajhKdENWSXNNdnpHQkVneldJRUZIdmxadjdoTDZ0WGtaZzZPWFh6bnc1U1NGUWhvTgpNWjlzeGJUSjVwdHN6cW0vK0d3aHY2RkwxT2NoemFNNENZMHlNeVd6d3RBdWlNNGxWMkJFOVZUbTdqVm5acmp0ClRkRDM2TUlEd2FDV3YvZE5EeHp0bmdrQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ==`
const template = [
  '====BEGIN LICENSE====',
  '{{&version}}',
  '{{&domain}}',
  '{{&deigest}}',
  '{{&serial}}',
  '=====END LICENSE====='
].join('\n');

@Module({})
export default class LicenseModule implements OnModuleInit, NestModule {
  private logger = new Logger("LicenseModule")
  private licenseData: any = null

  configure(consumer: MiddlewareConsumer) {
    consumer.apply((request: Request, response: Response, next: NextFunction): void => {
      const apiDomain = new URL("http://" + request.hostname).hostname.split('.').reverse()
      const domain = this.licenseData.data.domain.split('.').reverse()

      const apiDomainGlow = [...apiDomain].reverse().join(".")
      if (apiDomainGlow == "localhost" || apiDomainGlow == "127.0.0.1")
        return next();

      for (const i in domain) {
        if (domain[i] != apiDomain[i])
          return next(new ServiceUnavailableException(`${apiDomainGlow} (hostname) not allowed (by license)`))
      }

      return next();
    }).forRoutes("*")
  }

  onModuleInit() {
    try {
      if (!fs.existsSync("../../license.pem")) throw Error("License file not found")

      const licenseFile = fs.readFileSync("../../license.pem", "utf-8")
      this.licenseData = LicenseParser.parse({ publicKey: Buffer.from(publicKey, 'base64').toString('utf-8'), licenseFile, template });

      if (!this.licenseData.valid) throw Error("License file corrupted")

      const domain = new URL(envConfig.baseurl).hostname.split('.').reverse()
      const apiDomain = new URL(envConfig.apiBaseurl).hostname.split('.').reverse()
      const lDomain = this.licenseData.data.domain.split('.').reverse()

      for (const i in lDomain) {
        if (lDomain[i] != domain[i]) throw Error("Domain from \"BASEURL\" not allowed")
        if (lDomain[i] != apiDomain[i]) throw Error("Domain from \"API_BASEURL\" not allowed")
      }

      const deigest = crypto.createHash("md5").update(fs.readFileSync(__filename)).digest("hex")
      if (deigest != this.licenseData.data.deigest) throw Error("UnicoreServer bundle corrupted")
    } catch (e) {
      this.logger.error(e.message)
      process.exit()
    }
  }
}
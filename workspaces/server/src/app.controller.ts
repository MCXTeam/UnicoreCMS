import { All, Controller, Redirect } from "@nestjs/common";
import { envConfig } from "unicore-common";

@Controller()
export class AppController {
  @All()
  @Redirect(envConfig.baseurl, 301)
  mainSite() {}
}
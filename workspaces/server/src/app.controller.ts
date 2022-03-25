import { All, Controller, Redirect } from "@nestjs/common";
import { envConfig } from "unicore-common";
import { Public } from "./auth/decorators/public.decorator";

@Controller()
export class AppController {
  @Public()
  @All()
  @Redirect(envConfig.baseurl, 301)
  mainSite() {}
}
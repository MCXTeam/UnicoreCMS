import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { Permission } from 'unicore-common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GravitGetAuthDetails } from './dto/gravit-auth-details.dto';
import { GravitAuthorize } from './dto/inputs/gravit-authorize.input';
import { GravitCheckServer } from './dto/inputs/gravit-check-server.input';
import { GravitJoinServer } from './dto/inputs/gravit-join-server.input';
import { GravitRefreshToken } from './dto/inputs/gravit-refresh-token.input';
import { GravitService } from './gravit.service';

@SkipThrottle()
@Permissions([Permission.KernelUnicoreProvider])
@Controller('auth/gravit')
export class GravitController {
  constructor(private gravitService: GravitService) { }

  @Get('ping')
  ping(@CurrentUser() user: User): UserDto {
    return new UserDto(user)
  }

  @Get('getUserByUsername/:username')
  getUserByUsername(@Param('username') username: string) {
    return this.gravitService.getUserByUsername(username)
  }

  @Get('getUserByUUID/:uuid')
  getUserByUUID(@Param('uuid') uuid: string) {
    return this.gravitService.getUserByUUID(uuid)
  }

  @Get('getUserByToken')
  getUserByToken(@Headers('Bearer') token: string) {
    return this.gravitService.getUserByToken(token)
  }

  @Get('getAuthDetails')
  getDetails(): GravitGetAuthDetails {
    return {
      details: [
        { type: "password" },
        { type: "totp" }
      ]
    }
  }

  @Post('authorize')
  authorize(@Body() body: GravitAuthorize) {
    return this.gravitService.authorize(body)
  }

  @Post('refreshToken')
  refreshAccessToken(@Body() body: GravitRefreshToken) {
    return this.gravitService.refreshAccessToken(body)
  }

  @Post('deleteSession')
  deleteSession(@Body() body: any) {
    return this.gravitService.deleteSession(body)
  }

  @Post('exitUser')
  exitUser(@Body() body: any) {
    return this.gravitService.exitUser(body)
  }

  @Post('checkServer')
  checkServer(@Body() body: GravitCheckServer) {
    return this.gravitService.checkServer(body)
  }

  @Post('joinServer')
  joinServer(@Body() body: GravitJoinServer) {
    return this.gravitService.joinServer(body)
  }
}

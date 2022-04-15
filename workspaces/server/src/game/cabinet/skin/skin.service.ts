import { ForbiddenException, Injectable, NotFoundException, UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterFile } from 'fastify-file-interceptor';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { Permission } from 'unicore-common';
import sizeOf from 'image-size';
import { StorageManager } from '@common';
import { Repository } from 'typeorm';
import { Skin } from './entities/skin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cloak } from './entities/cloak.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { Image, Canvas, CanvasRenderingContext2D } from 'canvas'

@Injectable()
export class SkinService {
  constructor(
    @InjectRepository(Skin)
    private skinsRepository: Repository<Skin>,
    @InjectRepository(Cloak)
    private cloaksRepository: Repository<Cloak>,
    private usersService: UsersService
  ) { }

  private hasTransparency(context: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number): boolean {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const offset = (x + y * w) * 4;
        if (imgData.data[offset + 3] !== 0xff) {
          return true;
        }
      }
    }
    return false;
  }

  private isAreaBlack(context: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number): boolean {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const offset = (x + y * w) * 4;
        if (!(
          imgData.data[offset + 0] === 0 &&
          imgData.data[offset + 1] === 0 &&
          imgData.data[offset + 2] === 0 &&
          imgData.data[offset + 3] === 0xff
        )) {
          return false;
        }
      }
    }
    return true;
  }

  private isAreaWhite(context: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number): boolean {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const offset = (x + y * w) * 4;
        if (!(
          imgData.data[offset + 0] === 0xff &&
          imgData.data[offset + 1] === 0xff &&
          imgData.data[offset + 2] === 0xff &&
          imgData.data[offset + 3] === 0xff
        )) {
          return false;
        }
      }
    }
    return true;
  }

  private computeSkinScale(width: number): number {
    return width / 64.0;
  }

  private copyImage(context: CanvasRenderingContext2D, sX: number, sY: number, w: number, h: number, dX: number, dY: number, flipHorizontal: boolean): CanvasRenderingContext2D {
    const imgData = context.getImageData(sX, sY, w, h);
    if (flipHorizontal) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < (w / 2); x++) {
          const index = (x + y * w) * 4;
          const index2 = ((w - x - 1) + y * w) * 4;
          const pA1 = imgData.data[index];
          const pA2 = imgData.data[index + 1];
          const pA3 = imgData.data[index + 2];
          const pA4 = imgData.data[index + 3];

          const pB1 = imgData.data[index2];
          const pB2 = imgData.data[index2 + 1];
          const pB3 = imgData.data[index2 + 2];
          const pB4 = imgData.data[index2 + 3];

          imgData.data[index] = pB1;
          imgData.data[index + 1] = pB2;
          imgData.data[index + 2] = pB3;
          imgData.data[index + 3] = pB4;

          imgData.data[index2] = pA1;
          imgData.data[index2 + 1] = pA2;
          imgData.data[index2 + 2] = pA3;
          imgData.data[index2 + 3] = pA4;
        }
      }
    }
    context.putImageData(imgData, dX, dY);

    return context
  }

  private convertSkinTo1_8(context: CanvasRenderingContext2D, width: number): CanvasRenderingContext2D {
    const scale = this.computeSkinScale(width);
    const copySkin = (context, sX: number, sY: number, w: number, h: number, dX: number, dY: number, flipHorizontal: boolean): CanvasRenderingContext2D =>
      this.copyImage(context, sX * scale, sY * scale, w * scale, h * scale, dX * scale, dY * scale, flipHorizontal);

    context = copySkin(context, 4, 16, 4, 4, 20, 48, true); // Top Leg
    context = copySkin(context, 8, 16, 4, 4, 24, 48, true); // Bottom Leg
    context = copySkin(context, 0, 20, 4, 12, 24, 52, true); // Outer Leg
    context = copySkin(context, 4, 20, 4, 12, 20, 52, true); // Front Leg
    context = copySkin(context, 8, 20, 4, 12, 16, 52, true); // Inner Leg
    context = copySkin(context, 12, 20, 4, 12, 28, 52, true); // Back Leg
    context = copySkin(context, 44, 16, 4, 4, 36, 48, true); // Top Arm
    context = copySkin(context, 48, 16, 4, 4, 40, 48, true); // Bottom Arm
    context = copySkin(context, 40, 20, 4, 12, 40, 52, true); // Outer Arm
    context = copySkin(context, 44, 20, 4, 12, 36, 52, true); // Front Arm
    context = copySkin(context, 48, 20, 4, 12, 32, 52, true); // Inner Arm
    context = copySkin(context, 52, 20, 4, 12, 44, 52, true); // Back Arm
    return context
  }

  private fixOpaqueSkin(context: CanvasRenderingContext2D, width: number, format1_8: boolean): CanvasRenderingContext2D {
    if (format1_8) {
      if (this.hasTransparency(context, 0, 0, width, width))
        return;
    } else {
      if (this.hasTransparency(context, 0, 0, width, width / 2))
        return;
    }
  
    const scale = this.computeSkinScale(width);
    const clearArea = (x: number, y: number, w: number, h: number): void =>
      context.clearRect(x * scale, y * scale, w * scale, h * scale);
  
    clearArea(40, 0, 8, 8); // Helm Top
    clearArea(48, 0, 8, 8); // Helm Bottom
    clearArea(32, 8, 8, 8); // Helm Right
    clearArea(40, 8, 8, 8); // Helm Front
    clearArea(48, 8, 8, 8); // Helm Left
    clearArea(56, 8, 8, 8); // Helm Back
  
    if (format1_8) {
      clearArea(4, 32, 4, 4); // Right Leg Layer 2 Top
      clearArea(8, 32, 4, 4); // Right Leg Layer 2 Bottom
      clearArea(0, 36, 4, 12); // Right Leg Layer 2 Right
      clearArea(4, 36, 4, 12); // Right Leg Layer 2 Front
      clearArea(8, 36, 4, 12); // Right Leg Layer 2 Left
      clearArea(12, 36, 4, 12); // Right Leg Layer 2 Back
      clearArea(20, 32, 8, 4); // Torso Layer 2 Top
      clearArea(28, 32, 8, 4); // Torso Layer 2 Bottom
      clearArea(16, 36, 4, 12); // Torso Layer 2 Right
      clearArea(20, 36, 8, 12); // Torso Layer 2 Front
      clearArea(28, 36, 4, 12); // Torso Layer 2 Left
      clearArea(32, 36, 8, 12); // Torso Layer 2 Back
      clearArea(44, 32, 4, 4); // Right Arm Layer 2 Top
      clearArea(48, 32, 4, 4); // Right Arm Layer 2 Bottom
      clearArea(40, 36, 4, 12); // Right Arm Layer 2 Right
      clearArea(44, 36, 4, 12); // Right Arm Layer 2 Front
      clearArea(48, 36, 4, 12); // Right Arm Layer 2 Left
      clearArea(52, 36, 12, 12); // Right Arm Layer 2 Back
      clearArea(4, 48, 4, 4); // Left Leg Layer 2 Top
      clearArea(8, 48, 4, 4); // Left Leg Layer 2 Bottom
      clearArea(0, 52, 4, 12); // Left Leg Layer 2 Right
      clearArea(4, 52, 4, 12); // Left Leg Layer 2 Front
      clearArea(8, 52, 4, 12); // Left Leg Layer 2 Left
      clearArea(12, 52, 4, 12); // Left Leg Layer 2 Back
      clearArea(52, 48, 4, 4); // Left Arm Layer 2 Top
      clearArea(56, 48, 4, 4); // Left Arm Layer 2 Bottom
      clearArea(48, 52, 4, 12); // Left Arm Layer 2 Right
      clearArea(52, 52, 4, 12); // Left Arm Layer 2 Front
      clearArea(56, 52, 4, 12); // Left Arm Layer 2 Left
      clearArea(60, 52, 4, 12); // Left Arm Layer 2 Back
    }
  }

  private loadSkinToCanvas(canvas: Canvas, image: Image): Canvas {
    let isOldFormat = false;
    if (image.width !== image.height) {
      if (image.width === 2 * image.height) {
        isOldFormat = true;
      } else {
        throw new Error(`Bad skin size: ${image.width}x${image.height}`);
      }
    }
  
    var context = canvas.getContext("2d")!;
    if (isOldFormat) {
      const sideLength = image.width;
      canvas.width = sideLength;
      canvas.height = sideLength;
      context.clearRect(0, 0, sideLength, sideLength);
      context.drawImage(image, 0, 0, sideLength, sideLength / 2.0);
      context = this.convertSkinTo1_8(context, sideLength);
      context = this.fixOpaqueSkin(context, canvas.width, false);
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, image.width, image.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context = this.fixOpaqueSkin(context, canvas.width, true);
    }

    return canvas
  }

  private isSlim(filepath: string): boolean {
    const skinImage = new Image()
    skinImage.src = StorageManager.read(filepath)
    const skinCanvas = this.loadSkinToCanvas(new Canvas(skinImage.width, skinImage.height), skinImage)

    const scale = this.computeSkinScale(skinCanvas.width);
    const context = skinCanvas.getContext("2d")!;

    const checkTransparency = (x: number, y: number, w: number, h: number): boolean =>
      this.hasTransparency(context, x * scale, y * scale, w * scale, h * scale);
    const checkBlack = (x: number, y: number, w: number, h: number): boolean =>
      this.isAreaBlack(context, x * scale, y * scale, w * scale, h * scale);
    const checkWhite = (x: number, y: number, w: number, h: number): boolean =>
      this.isAreaWhite(context, x * scale, y * scale, w * scale, h * scale);
    const isSlim =
      (
        checkTransparency(50, 16, 2, 4) ||
        checkTransparency(54, 20, 2, 12) ||
        checkTransparency(42, 48, 2, 4) ||
        checkTransparency(46, 52, 2, 12)
      ) ||
      (
        checkBlack(50, 16, 2, 4) &&
        checkBlack(54, 20, 2, 12) &&
        checkBlack(42, 48, 2, 4) &&
        checkBlack(46, 52, 2, 12)
      ) ||
      (
        checkWhite(50, 16, 2, 4) &&
        checkWhite(54, 20, 2, 12) &&
        checkWhite(42, 48, 2, 4) &&
        checkWhite(46, 52, 2, 12)
      );
    return isSlim;
  }

  async updateSkin(user: User, file: MulterFile) {
    let skin = (await this.skinsRepository.findOne(user.uuid)) || new Skin();

    if (skin.file) StorageManager.remove(skin.file);

    skin.user = user;
    skin.file = file.filename;
    skin.slim = this.isSlim(file.filename)

    return this.skinsRepository.save(skin);
  }

  async updateSkinMe(req: any, file: MulterFile) {
    const { width, height } = sizeOf(StorageManager.read(file.filename));

    if (width > 2048 || height > 2048) {
      StorageManager.remove(file.filename);
      throw new UnsupportedMediaTypeException();
    }

    if ((width > 64 || height > 64) && !await matchPermission([Permission.UserCabinetSkinHd], req)) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException();
    }

    return this.updateSkin(req.user, file);
  }

  async updateSkinByUUID(uuid: string, file: MulterFile) {
    const user = await this.usersService.getById(uuid)
    if (!user) throw new NotFoundException()

    return this.updateSkin(user, file)
  }

  async updateCloak(user: User, file: MulterFile) {
    let cloak = (await this.cloaksRepository.findOne(user.uuid)) || new Cloak();

    if (cloak.file) StorageManager.remove(cloak.file);

    cloak.user = user;
    cloak.file = file.filename;

    return this.cloaksRepository.save(cloak);
  }

  async updateCloakMe(req: any, file: MulterFile) {
    const { width, height } = sizeOf(StorageManager.read(file.filename));

    if (width > 2048 || height > 2048) {
      StorageManager.remove(file.filename);
      throw new UnsupportedMediaTypeException();
    }

    if ((width > 64 || height > 64) && !await matchPermission([Permission.UserCabinetCloakHd], req)) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException();
    }

    return this.updateCloak(req.user, file)
  }

  async updateCloakByUUID(uuid: string, file: MulterFile) {
    const user = await this.usersService.getById(uuid)
    if (!user) throw new NotFoundException()

    return this.updateCloak(user, file)
  }

  async removeCloak(user: User) {
    if (!user.cloak) return;

    let cloak = await this.cloaksRepository.findOne(user.uuid);
    cloak.user = user;

    if (cloak) this.cloaksRepository.remove(cloak);
  }

  async removeCloakByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid)
    if (!user) throw new NotFoundException()

    return this.removeCloak(user)
  }

  async removeSkin(user: User) {
    if (!user.skin) return;

    let skin = await this.skinsRepository.findOne(user.uuid);
    skin.user = user;

    if (skin) this.skinsRepository.remove(skin);
  }

  async removeSkinByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid)
    if (!user) throw new NotFoundException()

    return this.removeSkin(user)
  }
}

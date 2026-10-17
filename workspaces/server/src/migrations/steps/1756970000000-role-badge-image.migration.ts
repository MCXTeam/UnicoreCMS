import { MigrationInterface, QueryRunner } from 'typeorm';

const translations = [
  ['ru', 'admin.role_badge_image', 'Картинка на фон', 'Картинка плашки'],
  ['ru', 'admin.role_badge_image_hint', 'Растягивается по плашке и перекрывает цвет фона.', 'Заменяет текст плашки и сохраняет пропорции исходного изображения.'],
  ['en', 'admin.role_badge_image', 'Background image', 'Badge image'],
  ['en', 'admin.role_badge_image_hint', 'Stretched over the badge and covers the background color.', 'Replaces the badge text and keeps the original image proportions.'],
];

export class RoleBadgeImage1756970000000 implements MigrationInterface {
  name = 'RoleBadgeImage1756970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.getTable('unicore_translations'))) return;

    for (const [locale, key, before, after] of translations)
      await queryRunner.query(
        'UPDATE `unicore_translations` SET `value` = ? WHERE `locale_code` = ? AND `translation_key` = ? AND `value` = ?',
        [after, locale, key, before],
      );
  }

  public async down(): Promise<void> {
    return;
  }
}

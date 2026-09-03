export interface ConfigHint {
  title: string
  hint: string
}

export const CONFIG_HINTS: Record<string, ConfigHint> = {
  public_launcher_exe: {
    title: 'cfg.public_launcher_exe_title',
    hint: 'cfg.public_launcher_exe_hint',
  },
  public_launcher_jar: {
    title: 'cfg.public_launcher_jar_title',
    hint: 'cfg.public_launcher_jar_hint',
  },
  public_economy_rate: {
    title: 'cfg.public_economy_rate_title',
    hint: 'cfg.public_economy_rate_hint',
  },
  public_virtual_percent: {
    title: 'cfg.public_virtual_percent_title',
    hint: 'cfg.public_virtual_percent_hint',
  },
  public_referal_trigger: {
    title: 'cfg.public_referal_trigger_title',
    hint: 'cfg.public_referal_trigger_hint',
  },
  public_referal_reward: {
    title: 'cfg.public_referal_reward_title',
    hint: 'cfg.public_referal_reward_hint',
  },
  public_referal_reward_player: {
    title: 'cfg.public_referal_reward_player_title',
    hint: 'cfg.public_referal_reward_player_hint',
  },
  public_referal_payment_percent: {
    title: 'cfg.public_referal_payment_percent_title',
    hint: 'cfg.public_referal_payment_percent_hint',
  },
  public_monitoring_reward: {
    title: 'cfg.public_monitoring_reward_title',
    hint: 'cfg.public_monitoring_reward_hint',
  },
  public_votes_twink_protect: {
    title: 'cfg.public_votes_twink_protect_title',
    hint: 'cfg.public_votes_twink_protect_hint',
  },
  public_unban_price: {
    title: 'cfg.public_unban_price_title',
    hint: 'cfg.public_unban_price_hint',
  },
  public_link_forum: {
    title: 'cfg.public_link_forum_title',
    hint: 'cfg.public_link_forum_hint',
  },
  public_link_discord: {
    title: 'cfg.public_link_discord_title',
    hint: 'cfg.public_link_discord_hint',
  },
  public_link_vk: {
    title: 'cfg.public_link_vk_title',
    hint: 'cfg.public_link_vk_hint',
  },
  public_link_telegram: {
    title: 'cfg.public_link_telegram_title',
    hint: 'cfg.public_link_telegram_hint',
  },
  public_link_youtube: {
    title: 'cfg.public_link_youtube_title',
    hint: 'cfg.public_link_youtube_hint',
  },
  public_link_mctop: {
    title: 'cfg.public_link_mctop_title',
    hint: 'cfg.public_link_mctop_hint',
  },
  public_link_topcraft: {
    title: 'cfg.public_link_topcraft_title',
    hint: 'cfg.public_link_topcraft_hint',
  },
  public_link_minecraftraiting: {
    title: 'cfg.public_link_minecraftraiting_title',
    hint: 'cfg.public_link_minecraftraiting_hint',
  },
  public_store_products_virtual_use: {
    title: 'cfg.public_store_products_virtual_use_title',
    hint: 'cfg.public_store_products_virtual_use_hint',
  },
  public_store_kits_virtual_use: {
    title: 'cfg.public_store_kits_virtual_use_title',
    hint: 'cfg.public_store_kits_virtual_use_hint',
  },
  public_donate_groups_virtual_use: {
    title: 'cfg.public_donate_groups_virtual_use_title',
    hint: 'cfg.public_donate_groups_virtual_use_hint',
  },
  public_donate_perms_virtual_use: {
    title: 'cfg.public_donate_perms_virtual_use_title',
    hint: 'cfg.public_donate_perms_virtual_use_hint',
  },
  public_email_activation_required: {
    title: 'cfg.public_email_activation_required_title',
    hint: 'cfg.public_email_activation_required_hint',
  },
  public_ordinary_register: {
    title: 'cfg.public_ordinary_register_title',
    hint: 'cfg.public_ordinary_register_hint',
  },
  password_breach_check: {
    title: 'cfg.password_breach_check_title',
    hint: 'cfg.password_breach_check_hint',
  },
  cleanup_payments_paid_days: {
    title: 'cfg.cleanup_payments_paid_days_title',
    hint: 'cfg.cleanup_payments_paid_days_hint',
  },
  cleanup_payments_pending_days: {
    title: 'cfg.cleanup_payments_pending_days_title',
    hint: 'cfg.cleanup_payments_pending_days_hint',
  },
  cleanup_history_days: {
    title: 'cfg.cleanup_history_days_title',
    hint: 'cfg.cleanup_history_days_hint',
  },
  cleanup_audit_access_days: {
    title: 'cfg.cleanup_audit_access_days_title',
    hint: 'cfg.cleanup_audit_access_days_hint',
  },
  cleanup_audit_finance_days: {
    title: 'cfg.cleanup_audit_finance_days_title',
    hint: 'cfg.cleanup_audit_finance_days_hint',
  },
  cleanup_audit_admin_days: {
    title: 'cfg.cleanup_audit_admin_days_title',
    hint: 'cfg.cleanup_audit_admin_days_hint',
  },
  cleanup_audit_content_days: {
    title: 'cfg.cleanup_audit_content_days_title',
    hint: 'cfg.cleanup_audit_content_days_hint',
  },
  rcon_preset: {
    title: 'cfg.rcon_preset_title',
    hint: 'cfg.rcon_preset_hint',
  },
  rcon_tpl_give_item: {
    title: 'cfg.rcon_tpl_give_item_title',
    hint: 'cfg.rcon_tpl_give_item_hint',
  },
  rcon_tpl_group_add: {
    title: 'cfg.rcon_tpl_group_add_title',
    hint: 'cfg.rcon_tpl_group_add_hint',
  },
  rcon_tpl_group_add_temp: {
    title: 'cfg.rcon_tpl_group_add_temp_title',
    hint: 'cfg.rcon_tpl_group_add_temp_hint',
  },
  rcon_tpl_group_remove: {
    title: 'cfg.rcon_tpl_group_remove_title',
    hint: 'cfg.rcon_tpl_group_remove_hint',
  },
  rcon_tpl_perm_set: {
    title: 'cfg.rcon_tpl_perm_set_title',
    hint: 'cfg.rcon_tpl_perm_set_hint',
  },
  rcon_tpl_perm_set_temp: {
    title: 'cfg.rcon_tpl_perm_set_temp_title',
    hint: 'cfg.rcon_tpl_perm_set_temp_hint',
  },
  rcon_tpl_perm_unset: {
    title: 'cfg.rcon_tpl_perm_unset_title',
    hint: 'cfg.rcon_tpl_perm_unset_hint',
  },
  public_gifts_code_enabled: {
    title: 'cfg.public_gifts_code_enabled_title',
    hint: 'cfg.public_gifts_code_enabled_hint',
  },
  public_gifts_direct_enabled: {
    title: 'cfg.public_gifts_direct_enabled_title',
    hint: 'cfg.public_gifts_direct_enabled_hint',
  },
  gifts_daily_limit: {
    title: 'cfg.gifts_daily_limit_title',
    hint: 'cfg.gifts_daily_limit_hint',
  },
  gifts_code_expire_days: {
    title: 'cfg.gifts_code_expire_days_title',
    hint: 'cfg.gifts_code_expire_days_hint',
  },
  public_gifts_regift_percent: {
    title: 'cfg.public_gifts_regift_percent_title',
    hint: 'cfg.public_gifts_regift_percent_hint',
  },
  laminara_builds: {
    title: 'cfg.laminara_builds_title',
    hint: 'cfg.laminara_builds_hint',
  },
  public_role_badge_before: {
    title: 'cfg.public_role_badge_before_title',
    hint: 'cfg.public_role_badge_before_hint',
  },
}

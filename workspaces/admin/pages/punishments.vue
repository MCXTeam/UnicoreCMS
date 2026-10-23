<template>
  <div class="card punishments-page">
    <h1>{{ $t('punishments.title') }}</h1>
    <Message v-if="state.error.value" severity="error" :closable="false">{{ state.error.value }}</Message>
    <Tabs value="cases">
      <TabList>
        <Tab value="cases">{{ $t('punishments.title') }}</Tab>
        <Tab v-if="state.options.value.canManageGroups" value="groups">{{ $t('punishments.groups') }}</Tab>
        <Tab value="purchases">{{ $t('punishments.purchases') }}</Tab>
        <Tab v-if="state.options.value.canManageSettings" value="settings">{{ $t('punishments.settings') }}</Tab>
        <Tab value="instances">{{ $t('punishments.instances') }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="cases"><PunishmentsCases :state="state" /></TabPanel>
        <TabPanel v-if="state.options.value.canManageGroups" value="groups"><PunishmentsGroups :state="state" /></TabPanel>
        <TabPanel value="purchases"><PunishmentsPurchases :state="state" /></TabPanel>
        <TabPanel v-if="state.options.value.canManageSettings" value="settings"><PunishmentsSettings :state="state" /></TabPanel>
        <TabPanel value="instances"><PunishmentsInstances :state="state" /></TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
const state = usePunishmentAdmin()
</script>

<style>
.punishments-page { min-width: 0; }
.punishments-page h1 { margin-top: 0; font-size: 1.5rem; }
.punishments-page .p-tablist-tab-list { flex-wrap: wrap; }
.punishments-page .p-tabpanel { padding-inline: 0; }
.punishments-toolbar { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1rem; align-items: center; }
.punishments-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
.punishments-panel { padding: 1rem; border: 1px solid var(--p-content-border-color); border-radius: var(--p-content-border-radius); min-width: 0; overflow-wrap: anywhere; }
.punishments-form { display: grid; gap: 1rem; }
.punishments-form > label:not(.punishments-field) { min-height: 2rem; }
.punishments-field { display: grid; gap: .5rem; min-width: 0; }
.punishments-field > .p-select, .punishments-field > .p-multiselect, .punishments-field > .p-inputnumber, .punishments-field > .p-autocomplete { width: 100%; min-width: 0; }
.punishments-reason { white-space: pre-wrap; overflow-wrap: anywhere; }
.punishments-page .p-datatable-tbody td { overflow-wrap: anywhere; max-width: 28rem; }
.punishments-page button, .punishments-form button { white-space: normal; }
.punishments-dialog .p-dialog-footer { flex-wrap: wrap; }
.punishments-dialog button { white-space: normal; max-width: 100%; }
.punishments-dialog .p-multiselect-label { white-space: normal; overflow-wrap: anywhere; }
</style>

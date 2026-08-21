<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <h5>{{ $t('mod.demo.notes') }}</h5>
        <DataTable :value="notes" :loading="loading" responsiveLayout="scroll" dataKey="id">
          <Column field="id" header="ID" :style="{ width: '6rem' }" />
          <Column field="text" :header="$t('admin.content')" />
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return { notes: [], loading: true }
  },
  async mounted() {
    this.notes = await this.$api
      .get('/mod/demo/notes')
      .then((res) => res.data.notes)
      .catch(() => [])
    this.loading = false
  },
}
</script>

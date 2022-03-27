<template>
  <div class="grid">
    <div class="col-12 md:col-6">
      <div class="card p-fluid">
        <h4>Профиль</h4>
        <div class="field">
          <label>Имя пользователя</label>
          <InputText type="text" />
        </div>
        <div class="field">
          <label>Email</label>
          <InputText type="text" />
        </div>
        <div class="field">
          <label>UUID</label>
          <InputText type="text" readonly />
        </div>
        <h4>Роли и права</h4>
        <div class="field">
          <label>Роли</label>
          <InputText type="text" />
        </div>
        <div class="field">
          <label>Права</label>
          <InputText type="text" />
        </div>
        <h4>Сменить пароль</h4>
        <div class="field">
          <label>Пароль</label>
          <InputText type="text" />
        </div>
        <div class="field">
          <label>Подтверждение пароля</label>
          <InputText type="text" />
        </div>
      </div>
    </div>
    <div class="col-12 md:col-6">
      <div class="card p-fluid">
        <h4>Внешний вид</h4>
      </div>
      <div class="card p-fluid">
        <h4>Экономика</h4>
      </div>
      <div class="card p-fluid">
        <h4>Донат-группы</h4>
      </div>
      <div class="card p-fluid">
        <h4>Донат-права</h4>
      </div>
      <div class="card p-fluid">
        <h4>Блокировка</h4>
      </div>
    </div>
    <div class="col-12">
      <div class="card p-fluid">
        <h4>Магазин и склад</h4>
      </div>
    </div>
    <div class="col-12">
      <div class="card p-fluid">
        <h4>Статистика</h4>
      </div>
    </div>
    <div class="col-12">
      <div class="card p-fluid">
        <h4>История действий</h4>
      </div>
    </div>
  </div>
</template>

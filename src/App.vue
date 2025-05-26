<template>
  <div class="min-h-screen">

    <Header />
    <!-- 사이드바 -->
    <Sidebar />

    <!-- 메인 컨텐츠 -->
    <main class="ml-38 pt-16 pl-6">
      <RouterView />
    </main>
  </div>


</template>
<script setup>
import Header from './components/AppHeader.vue'
import Sidebar from './components/AppSidebar.vue'
</script>

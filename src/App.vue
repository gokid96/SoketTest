<template>
  <!-- <div class="min-h-screen flex flex-col">
    <Header />

    <div class="flex flex-1">
      <Sidebar />
      <main class="bg-gray-100 flex-1 pt-16 pl-4">
        <RouterView />
      </main>
    </div>
  </div> -->
  <div class="min-h-screen flex flex-col">
    <Header class="fixed top-0 left-0 right-0 z-30" />

    <div class="flex flex-1 mt-14"> <!-- Header 높이만큼 margin -->
      <Sidebar />
      <main class="bg-gray-100 flex-1 p-6 overflow-x-auto">
        <RouterView />
      </main>
    </div>
  </div>


</template>
<script setup>
import Header from './components/AppHeader.vue'
import Sidebar from './components/AppSidebar.vue'
</script>

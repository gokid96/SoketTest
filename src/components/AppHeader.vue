<template>
  <header class="fixed top-0 left-0 right-0 border-b border-gray-600 backdrop-blur-lg z-50">
    <nav class="container max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <h1 class="text-black text-2xl font-bold">Soket TEST</h1>
      </div>

      <div class="hidden md:flex items-center gap-x-6">

        <!-- <button id="darkModeToggle"
          class="p-2 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-500 focus:outline-none focus:ring focus:ring-blue-500">
          <i class="fas fa-moon text-gray-700 dark:text-yellow-400"> </i>
        </button> -->
      </div>
      <button id="menuToggle" class="md:hidden p-2 text-gray-700 dark:text-white">
        <i class="fas fa-bars text-2xl"></i>
      </button>
    </nav>
  </header>
</template>

<script>
export default {
  setup() {
    return {}
  }
}
</script>

<style lang="scss" scoped></style>

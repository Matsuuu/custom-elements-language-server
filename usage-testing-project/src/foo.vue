<script setup>

import { ref } from 'vue'
const greeting = ref('Hello World!')
</script>

<template>
  <div>
    <sl-button variant=""></sl-button>
    <example-project></example-project>

    <sl-icon>

    <p class="greeting">{{ greeting }}</p>
  </div>
</template>

<style>
.greeting {
  color: red;
  font-weight: bold;
}
</style>

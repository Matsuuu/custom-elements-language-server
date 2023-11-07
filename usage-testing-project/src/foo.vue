
<script setup>
import "./example-project.js";
import { ref } from 'vue'
const greeting = ref('Hello World!')
</script>

<template>
  <div>
    <sl-button variant="">

    <p class="greeting">{{ greeting }}</p>
  </div>
</template>

<style>
.greeting {
  color: red;
  font-weight: bold;
}
</style>

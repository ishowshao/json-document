<template>
  <div
    class="absolute -top-1 -right-1 z-10 flex gap-1 bg-white border border-gray-300 rounded-2xl p-0.5 shadow-md transition-opacity duration-200"
  >
    <button
      class="flex items-center justify-center w-5 h-5 rounded-full border-none cursor-pointer text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
      title="Add new item"
      @click.stop="addItem"
    >
      +
    </button>
    <button
      v-if="isItem"
      class="flex items-center justify-center w-5 h-5 rounded-full border-none cursor-pointer text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
      title="Remove this item"
      @click.stop="removeItem"
    >
      -
    </button>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { getSchemaForPath, generateDefaultFromSchema } from '@/utils/schema'

const documentStore = inject('documentStore')

const props = defineProps({
  arrayPath: {
    type: String,
    required: true,
  },
  itemPath: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['patch'])

const isItem = computed(() => !!props.itemPath)

function addItem() {
  const documentSchema = documentStore.documentSchema
  let newValue

  if (documentSchema) {
    const pathSegments = props.arrayPath.split('/').filter(Boolean)
    const arraySchema = getSchemaForPath(documentSchema, pathSegments)

    if (arraySchema && arraySchema.element) {
      newValue = generateDefaultFromSchema(arraySchema.element)
    } else {
      // Fallback if schema for path is not found
      newValue = 'New Item'
    }
  } else {
    // Fallback if no document schema is provided
    const arrayNode = documentStore.getNodeByPointer(props.arrayPath)
    if (arrayNode && arrayNode.length > 0 && typeof arrayNode[0] === 'object') {
      newValue = {}
    } else {
      newValue = 'New Item'
    }
  }

  emit('patch', {
    op: 'add',
    path: `${props.arrayPath}/-`,
    value: newValue,
  })
}

function removeItem() {
  if (!props.itemPath) return

  emit('patch', {
    op: 'remove',
    path: props.itemPath,
  })
}
</script>

<style scoped></style>

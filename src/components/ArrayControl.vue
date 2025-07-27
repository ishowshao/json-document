<template>
  <div class="array-control" :style="controlStyle">
    <button class="control-btn add-btn" title="Add new item" @click.stop="addItem">+</button>
    <button
      v-if="isItem"
      class="control-btn remove-btn"
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

// Basic styling to position the control box
const controlStyle = computed(() => ({
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  zIndex: 10,
  display: 'flex',
  gap: '4px',
}))

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

<style scoped>
.array-control {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 16px;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.2s ease-in-out;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: white;
  transition: background-color 0.2s;
}

.add-btn {
  background-color: #28a745; /* Green */
}

.add-btn:hover {
  background-color: #218838;
}

.remove-btn {
  background-color: #dc3545; /* Red */
}

.remove-btn:hover {
  background-color: #c82333;
}
</style>

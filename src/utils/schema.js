import { z } from 'zod'

/**
 * Recursively traverses a Zod schema to find the sub-schema corresponding to a given path.
 * @param {z.ZodTypeAny} schema The root Zod schema.
 * @param {string[]} path An array of keys/indices representing the path.
 * @returns {z.ZodTypeAny | null} The sub-schema at the specified path, or null if not found.
 */
export function getSchemaForPath(schema, path) {
  let currentSchema = schema

  for (const segment of path) {
    if (!currentSchema) return null

    if (currentSchema instanceof z.ZodObject) {
      currentSchema = currentSchema.shape[segment]
    } else if (currentSchema instanceof z.ZodArray) {
      currentSchema = currentSchema.element
    } else {
      return null // Path goes deeper than schema definition
    }
  }

  return currentSchema
}

/**
 * Generates a default value based on a Zod schema.
 * @param {z.ZodTypeAny} schema The Zod schema to generate a default value for.
 * @returns {any} A default value that conforms to the schema.
 */
export function generateDefaultFromSchema(schema) {
  if (!schema) return null

  if (schema instanceof z.ZodObject) {
    const defaultObject = {}
    for (const key in schema.shape) {
      defaultObject[key] = generateDefaultFromSchema(schema.shape[key])
    }
    return defaultObject
  }

  if (schema instanceof z.ZodArray) {
    return []
  }

  if (schema instanceof z.ZodString) {
    return ''
  }

  if (schema instanceof z.ZodNumber) {
    return 0
  }

  if (schema instanceof z.ZodBoolean) {
    return false
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return generateDefaultFromSchema(schema.unwrap())
  }

  // Fallback for any other types (e.g., enums, literals)
  if (schema._def.values) {
    return schema._def.values[0] // For enums, return the first value
  }

  return null
}

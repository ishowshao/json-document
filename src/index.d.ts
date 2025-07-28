import { DefineComponent, App } from 'vue'
import { Store } from 'pinia'

// Component Props Types
export interface JsonDocumentProps {
  jsonData: Record<string, any>
  presentationSchema: PresentationSchema
  documentSchema?: any
  readonly?: boolean
}

export interface NodeRendererProps {
  path: string
  schema: PresentationSchema
}

export interface EditableFieldProps {
  path: string
  value: string | number | boolean
  editorConfig?: string
}

export interface ArrayControlProps {
  arrayPath: string
  itemPath?: string | null
}

// Schema Types
export interface PresentationSchema {
  rules?: Record<string, PresentationRule>
  layout?: Record<string, LayoutRule>
}

export interface PresentationRule {
  tag?: string
  editor?: string
  useValueAs?: string
}

export interface LayoutRule {
  tag?: string
  static?: {
    before?: Array<{ tag: string; content: string }>
    after?: Array<{ tag: string; content: string }>
  }
}

// JSON Patch Types
export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: any
  from?: string
}

// Store Types
export interface DocumentState {
  document: Record<string, any> | null
  documentSchema: any | null
  errors: string[]
  hasDocument: boolean
}

export interface DocumentStore extends Store<'document', DocumentState> {
  setDocument(doc: Record<string, any>): void
  setDocumentSchema(schema: any): void
  getNodeByPointer(pointer: string): any
  applyPatch(patch: JsonPatch): boolean
  validateDocument(): boolean
  clearErrors(): void
}

// Schema Utility Types
export interface SchemaUtils {
  getSchemaForPath(schema: any, pathSegments: string[]): any
  generateDefaultFromSchema(schema: any): any
}

// Component Exports
export declare const JsonDocument: DefineComponent<JsonDocumentProps>
export declare const NodeRenderer: DefineComponent<NodeRendererProps>
export declare const EditableField: DefineComponent<EditableFieldProps>
export declare const ArrayControl: DefineComponent<ArrayControlProps>

// Store Export
export declare function useDocumentStore(): DocumentStore

// Utility Exports
export declare const schemaUtils: SchemaUtils

// Documentation Utilities
export declare const docs: {
  getUsageDocsPath(): string
  getDevDocsPath(): string
  openUsageDocs(): Promise<void>
  getQuickStartExample(): {
    template: string
    script: string
    install: string
    description: string
  }
  showHelp(): void
}

// Plugin Type
export interface JsonDocumentSystemPlugin {
  install(app: App): void
}

// Default Export
declare const JsonDocumentSystem: JsonDocumentSystemPlugin

export default JsonDocumentSystem

// Version Export
export declare const version: string

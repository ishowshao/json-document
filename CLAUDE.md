# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3-based JSON document system that implements dynamic content-presentation separation. The system renders JSON data through configurable presentation schemas and provides inline editing capabilities with JSON Patch-based state management.

**Core Architecture:**
- **Data Layer**: JSON documents as single source of truth
- **Presentation Layer**: HTML rendering controlled by presentation schemas  
- **Mapping Layer**: JSONPath-based rules that map JSON data to HTML elements and editing controls

## Development Commands

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run unit tests (Vitest)
npm run test:unit

# Run E2E tests (Playwright)
npm run test:e2e

# Format code
npm run format
```

## Key Technical Components

**Core Components:**
- `JsonDocument.vue` - Main orchestrator, manages JSON data and presentation schema
- `NodeRenderer.vue` - Recursive renderer that traverses JSON using JSONPath rules
- `EditableField.vue` - Handles inline editing with hover/click interactions
- `ArrayControl.vue` - Specialized component for handling array operations

**State Management (document.js store):**
- Pinia store manages JSON document state with `getNodeByPointer()` for JSON Pointer navigation
- All edits generate JSON Patch operations (RFC 6902) via `applyPatch()`
- Two-layer validation: field-level (immediate feedback) + document-level (structural integrity)
- Error tracking for validation failures and patch application errors

**Key Dependencies:**
- Vue 3 with Composition API and `provide/inject` for component communication
- Pinia for centralized state management
- JSONPath for data selection in presentation schemas
- JSON Patch (fast-json-patch) for atomic updates with `deepClone()` for safe mutations
- Zod for schema validation with utility functions in `/src/utils/schema.js`
- TailwindCSS v4 for styling

## Project Structure

- `/src/components/` - Vue components including the core rendering system
- `/src/stores/` - Pinia stores for document state management
- `/docs/` - Project requirements and technical specifications (Chinese)
- `/e2e/` - Playwright end-to-end tests
- `/src/components/__tests__/` - Vitest unit tests

## Architectural Patterns

**Rendering System:**
- Uses JSON Pointer (RFC 6901) paths like `/title`, `/content/0/text` for precise data targeting
- Presentation schemas define mapping rules using JSONPath expressions
- Recursive component pattern: `NodeRenderer` calls itself for nested structures
- Separation of concerns: data fetching, validation, and rendering are handled by different layers

**Inline Editing Flow:**
1. User hovers over editable content → visual feedback shows edit capability
2. Click activates inline edit mode → field becomes editable control
3. User edits → generates JSON Patch operation targeting specific JSON path
4. Patch applied to store → triggers validation → updates document if valid
5. UI re-renders with new data, maintaining cursor position and edit state

**Data Flow:**
```
JSON Data + Presentation Schema → JsonDocument → NodeRenderer → EditableField
                ↓
            Pinia Store ← JSON Patch ← User Edits
```

## Testing Strategy

- Unit tests use Vitest with jsdom environment
- E2E tests use Playwright
- For E2E tests, build the project first: `npm run build` then `npm run test:e2e`
- Install browsers for first E2E run: `npx playwright install`
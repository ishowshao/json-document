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

**Core Components to implement:**
- `JsonDocument.vue` - Main orchestrator, manages JSON data and presentation schema
- `NodeRenderer.vue` - Recursive renderer that traverses JSON using JSONPath rules
- `EditableField.vue` - Handles inline editing with hover/click interactions

**State Management:**
- Pinia store manages JSON document state
- All edits generate JSON Patch operations (RFC 6902)
- Two-layer validation: field-level (immediate feedback) + document-level (structural integrity)

**Key Dependencies:**
- Vue 3 with Composition API
- Pinia for state management
- JSONPath for data selection in presentation schemas
- JSON Patch (fast-json-patch) for atomic updates
- Zod for schema validation

## Project Structure

- `/src/components/` - Vue components including the core rendering system
- `/src/stores/` - Pinia stores for document state management
- `/docs/` - Project requirements and technical specifications (Chinese)
- `/e2e/` - Playwright end-to-end tests
- `/src/components/__tests__/` - Vitest unit tests

## Testing Strategy

- Unit tests use Vitest with jsdom environment
- E2E tests use Playwright
- For E2E tests, build the project first: `npm run build` then `npm run test:e2e`
- Install browsers for first E2E run: `npx playwright install`
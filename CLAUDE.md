# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

declarative-pdf is a Node.js library that generates PDF documents from declarative HTML templates using Puppeteer. It allows creating multi-page PDFs with customizable headers, footers, backgrounds, and page numbering through custom HTML elements.

## Commands

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run a single test file (partial match works)
pnpm test select-section

# Run tests with coverage
pnpm test:cov

# Build (runs tests first, then builds)
pnpm build

# Build library only (skip tests)
pnpm build:lib

# Run linter
pnpm lint

# Run example scripts
pnpm examples
```

## Architecture

### Core Flow

1. **DeclarativePDF** (`src/index.ts`) - Main entry point. Takes a Puppeteer browser instance and generates PDFs from HTML templates or Page instances.

2. **HTMLAdapter** (`src/utils/adapter-puppeteer.ts`) - Wrapper around Puppeteer's Page API. Handles content setting, viewport management, and PDF generation. Contains a 0.75 scaling workaround for Puppeteer's PDF dimension bug.

3. **DocumentPage** (`src/models/document-page.ts`) - Represents a `<document-page>` element from the template. Manages layout calculation and body rendering.

4. **buildPages** (`src/utils/layout/build-pages.ts`) - Assembles final PDF by combining body content with section elements (headers, footers, backgrounds) using pdf-lib.

### Evaluators (`src/evaluators/`)

Functions that run inside Puppeteer's page context via `page.evaluate()`:
- `template-normalize.ts` - Normalizes HTML structure, ensures proper nesting
- `template-settings.ts` - Extracts document-page settings (size, ppi)
- `section-settings.ts` - Extracts section dimensions and settings
- `prepare-section.ts` - Prepares sections for PDF rendering (sets visibility, page numbers)
- `reset-visibility.ts` - Resets element visibility after section rendering

### Custom HTML Elements

Templates use these custom elements:
- `<document-page>` - Container for a set of physical PDF pages (supports `format`, `size`, `ppi` attributes)
- `<page-body>` - Main content area (spans multiple pages if needed)
- `<page-header>`, `<page-footer>`, `<page-background>` - Repeating sections
- `<physical-page select="first|last|even|odd">` - Conditional content within repeating sections
- `<current-page-number>`, `<total-pages-number>` - Page number placeholders

### Path Aliases

Configured in `tsconfig.json`:
- `@app/*` maps to `src/*`
- `@test/*` maps to `test/*`

## Testing

- Tests use Jest with ts-jest
- Visual tests require ImageMagick/GraphicsMagick (`brew install imagemagick graphicsmagick`)
- Visual tests (`test/visual.test.ts`) are excluded in CI due to rendering differences
- Coverage threshold is 95% for all metrics
- Evaluators are excluded from coverage (they run in browser context)

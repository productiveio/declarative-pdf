# Development Guide

This guide will help you get started with developing the declarative-pdf project.

## Table of contents

- [Project Setup](#project-setup)
- [Testing](#testing)
  - [Visual tests](#visual-tests)
  - [Linking the library locally](#linking-the-library-locally)
- [Preparing for publishing](#preparing-for-publishing)
- [Publishing a new version](#publishing-a-new-version)

## Project Setup

1. Clone the repository:

```bash
git clone https://github.com/productiveio/declarative-pdf.git
cd declarative-pdf
```

2. Install the dependencies:

```bash
pnpm install
```

3. Run tests:

```bash
# all tests
pnpm test
# or a single test (e.g. test/utils/select-section.test.ts)
pnpm test select-section
```

4. Build the library (it creates a `dist` folder):

```bash
# run tests and build lib if they pass
pnpm build
# or just build the lib
pnpm build:lib
```

## Testing

The project uses Jest for testing. There are several test commands:

- `pnpm test`: runs all tests
- `pnpm test:cov`: runs all tests and generates a coverage report
- `pnpm test:ci`: runs all tests in CI mode (excluding visual test, because of CI issues with them)

### Visual tests

Visual tests are dependant a lib that depends on GraphicsMagick/Imagemagick. You can install those with homebrew:

```bash
brew install imagemagick graphicsmagick
```

They also might fail due to the differences in the rendering of the PDFs on different systems. Luckily, the diffs are generated and you can inspect them.

### Linking the library locally

In order to test the library locally, before publishing it to npm, you can link it to another project. To do that, you need to build the library first:

```bash
pnpm build
```

Then, in the project where you want to link the library, run:

```bash
npm link ../path/to/declarative-pdf
```

This will link the library to the project. You can now import it as if it was installed from npm:

```typescript
import { createPdf } from 'declarative-pdf';
```

When you're done testing, don't forget to unlink the library:

```bash
npm unlink declarative-pdf
```

## Preparing for publishing

Before publishing a new version, make sure to:

- [ ] 1. all tests are green
- [ ] 2. the coverage is >95% (ideally 100%)
- [ ] 3. examples in the `README.md` are up to date with new functionalities
- [ ] 4. you have manually tested the built package in a separate project by linking it (to make sure the types are correct)
- [ ] 5. and last, but not least, update the version in the `package.json` file

> [!NOTE]
> It is very important you don't skip any of these steps (especially step 4), as it can lead to a broken package and version hopping. Don't ask how we know this.

## Publishing a new version

You will need to be logged in to the npm registry to publish a new version. You can log in using the following command (we have our company acc for this):

```bash
npm login
```

After you have logged in, and you have fresh files in the `dist` folder, and you're sure that everything works, you can publish a new version:

```bash
npm publish
```

# Overview

A tool for generating PDF documents from HTML template that use declarative elements to control the layout and content of the PDF.

> TODO: neki dobar vizualni example da netko iz prve moze to brzo skuzit

|          Feature          |                                                                                     Description                                                                                     |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| headers and footers       | Use `<page-header>` and `<page-footer>` elements to define the header and footer for each `<document-page>`.                                                                        |
| page backgrounds          | Use `<page-background>` element to specify a custom background for each `<document-page>`.                                                                                          |
| page size and orientation | Use `<document-page>` element to specify page size and orientation.                                                                                                                 |
| multi-page content        | Use `<document-page>` element to spans across as many pages as needed. You can have multiple `<document-page>` elements in a single template with different sizes and orientations. |
| page numbering            | Use `<current-page-number>` and `<total-pages-number>` elements to display page numbers within headers or footers.                                                                  |

Layout is controlled using a set of custom HTML tags that define the structure of the PDF document. The package uses puppeteer to slice your template and generate PDF elements from it. Those elements are then used to assemble PDF pages into your PDF document.

> Unlike other HTML-to-PDF solutions that require manual coding of PDF layout and content, our tool uses declarative HTML elements to control the layout and content of the PDF. This makes it easier and faster to generate PDF documents from HTML templates, as you can simply define the structure of the PDF using custom HTML tags. Additionally, our tool provides features such as headers and footers, page backgrounds, and page numbering, which are not always available in other HTML-to-PDF solutions.

# Table of contents
- [Installation](#installation)
- [Usage](#usage)
- [API reference](#api-reference)
- [Template syntax](#template-syntax)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

# Installation

Install it locally in your project folder:

```bash
# using npm
npm install --save declarative-pdf
# or using yarn
yarn add declarative-pdf
```

> [!NOTE]
> This package supports both CommonJS and ES modules. If you are using a bundler such as Webpack or Rollup, you can import the package using ES modules syntax. If you are using Node.js, you can import the package using CommonJS syntax.

# Usage

We need a valid template for this to work, so let's use the one supplied in examples folder. For example:

```typescript
// Basic imports
import * as fs from 'fs/promises';
import generator from 'declarative-pdf';

(async function () {
  // Load html template into string
  const templateBuffer = await fs.readFile('./examples/basic-template.html');
  const template = templateBuffer.toString();

  // Generate PDF document and save it to disk
  const pdfBuffer = await generator(template);
  await fs.writeFile('./example-output.pdf', pdfBuffer);
})();
```

This would generate a PDF file `example-output.pdf` in your project folder. But it can be just as easily plugged into your express server:

```js
const express = require('express');
const generator = require('declarative-pdf');

(async function() {
  const app = express();

  app.use(express.urlencoded({
    extended: true,
    limit: '2000kb' // default limiit is 100kb and templates can grow
  }));

  async function generate(req, res) {
    const template = req.body.template;
    const name = req.body.name;
    const filename = `${name}.pdf`;

    const pdfBuffer = await generator(template, {keepAlive: true});

    res.setHeader('Content-disposition', `inline; name="${name}"; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.writeHead(200);
    res.end(Buffer.from(pdfBuffer).toString('base64'));
  }

  app.post('/generate', generate);

  const server = http.createServer(app);
  server.listen(config.port);
})();
```

So if you send POST request to this endpoint, with `template` as a string, containing your whole template file and `name` as a string, this would respond with generated PDF file.

> Spinning up puppeteer browser can be an expensive operation, so in some server scenarios it might be beneficial to keep browser instance running. With `keepAlive` option set to `true`, we are keeping the browser instance running and only disposing individual browser tabs.

# API reference

"declarative-pdf" exports only a single method. It accepts an HTML template string as the first argument and an optional `options` object as the second argument.

```js
const generate = require('declarative-pdf');

/**
 * Generates a PDF document from the given HTML template string.
 *
 * @param {string} html - The HTML template to use for the PDF document.
 * @param {object} options - Optional options for the PDF generation.
 *
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF document as a Buffer.
 */
const pdfBuffer = await generate(html, options)
```
The options object can include the following properties:

- `debug`: (boolean) A flag indicating whether to enable debug mode.
- `debugFilename`: (string) The name of the PDF file used for debug purposes.
- `keepAlive`: (boolean) A flag indicating whether to keep the puppeteer browser alive after the PDF has been generated.

The `generate` method returns a promise that resolves with the generated PDF document as a Buffer.

> TODO: explain what debug and debugFilename do

# Template syntax

Template example:
```html
<html>
  <head>
    <style>
      /* Add any CSS styles here */
    </style>
  </head>
  <body>
    <document-page>
      <page-background>
        /* Add any page-background content here */
      </page-background>
      <page-header>
        /* Add any page-header content here */
      </page-header>
      <page-body>
        /* Add any page-body content here */
      </page-body>
      <page-footer>
        /* Add any page-footer content here */
      </page-footer>
    </document-page>
  </body>
</html>
```

In this template, the `<page-header>`, `<page-body>`, and `<page-footer>` elements are used to define the structure of the PDF, with the `<page-header>` and `<page-footer>` elements being used as the header and footer, respectively, for each page. The `<page-body>` element spans multiple pages if necessary. The `<page-background>` element can be used to specify a custom background for each page. The `<document-page>` element acts as a container for the other elements.

Detailed explanation can be found here: [README-HTML-TEMPLATE.md](README-HTML-TEMPLATE.md)


# Examples

> TODO: this part needs some better examples...

```html
<!-- file: ./template.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My amazing template</title>
    <style>
      page-background {
        background-image: url("https://via.placeholder.com/595x842");
      }
    </style>
  </head>
  <body>
    <document-page>
      <page-background></page-background>

      <page-header>
        <div>A header that repeats on every page</div>
      </page-header>

      <page-body>
        <div>Hello world!</div>
      </page-body>

      <page-footer>
        <div>A footer that repeats on every page</div>
      </page-footer>
    </document-page>
  </body>
</html>
```

And then you pass html as a string into generator:

```js
// file: ./index.js
const fs = require("fs");
const pdf = require("declarative-html2pdf");
const html = fs.readFileSync("./template.html");

const pdfBuffer = pdf.generate(html, options);

pdf.writeBuffer(pdfBuffer, "output.pdf");
```

Which generates a new file, `output.pdf`.


# Troubleshooting

- wip

# Contributing

- wip

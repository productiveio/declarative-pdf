# Overview

The "declarative-pdf" npm package is a tool for generating PDF documents from HTML template that use declarative elements to control the layout and content of the PDF. The HTML template is just your classic HTML expanded with a set of custom HTML tags that define the structure and appearance of the PDF document, including `<document-page>`, `<page-background>`, `<page-header>`, `<page-body>`, and `<page-footer>`. Under the hood, it uses puppeteer to slice your template and generate PDF elements from it. Those elements are then used to assemble PDF pages into your PDF document.

> TODO: Name of this package is work in progress. Starting point was `declarative-html2pdf`, working idea is `declarative-pdf` -> but if something better comes along it shall be renamed.

> TODO: neki high level opis problema (zasto trenutna html-to-pdf rjesenja nisu dobra)

> TODO: neki dobar vizualni example da netko iz prve moze to brzo skuzit

# Table of contents
- [Installation](#installation)
- [Usage](#usage)
- [API reference](#api-reference)
- [Template syntax](#template-syntax)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

# Installation

> TODO: This doesn't work yet. This is probably how it will work once it's ready and published.

Install it locally in your project folder:

using npm:

```bash
npm install --save declarative-pdf
```

or if you prefer yarn:

```bash
yarn add declarative-pdf
```

# Get started

We need a valid template for this to work, so let's use the one supplied in examples folder. For example:

```js
// Basic imports
const fs = require('fs/promises');
const generator = require('declarative-pdf');

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

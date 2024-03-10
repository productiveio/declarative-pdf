# Template syntax

This package uses a simple template syntax to define the layout and content of a PDF document. A template consists of a series of elements, which can be nested to create a hierarchical structure. Each element has a set of properties that control its appearance and behavior:

- `<document-page>`: The root element for a set of physical pages in the PDF document. It can have the following child elements:
  - `<page-background>`: An element that can be used like a background print for the page.
  - `<page-header>`: An element that is used like a regular header for the page.
  - `<page-body>`: An element that spans across multiple pages if needed.
  - `<page-footer>`: An element that is used like a regular footer for the page.

You can include any valid HTML content within these elements.

<details>
  <summary>
    Note:
  </summary>

> Body should have `margin: 0; padding: 0;` and this is set during the template normalization stage. Adding some whitespace to body will result in `<page-...>` sections inheriting that whitespace which is probably something that you don't want.

> Body should have only `<document-page>` as child element(s) and every free element (other than `<script>` or `<style>`) will be wrapped in `<document-page>` during the template normalization stage.

> `<document-page>` must have `<page-body>` and should have only `<page-...>` elements as child element(s). During the normalization stage proper structure is enforced.

> Body is given `class="pdf"` during normalization stage, so you can use it to style your PDF differently than your HTML. For example, you can use a bit of CSS (`body:not(.pdf) document-page { ... }`) to display border and sizing around the template, mimicking the PDF page size.

</details>

# Table of contents

- [Template structure](#template-structure)
- [A very important note on page size (ppi)](#a-very-important-note-on-page-size-ppi)
- [Document page collection](#document-page-collection)
- [Main section - page body](#main-section---page-body)
- [Repeating sections](#repeating-sections)
  - [Repeating section elements](#repeating-section-elements)
    - [Background](#background)
    - [Header](#header)
    - [Footer](#footer)
  - [Repeating section special elements](#repeating-section-special-elements)
    - [Physical page](#physical-page)
    - [Current and total page number](#current-and-total-page-number)

## Template structure

The template is a simple HTML document that uses custom tags to define the layout and content of the PDF document. The following is an example of a minimal template:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <document-page>
      <page-body>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Ea in
        perferendis amet ipsam dignissimos. Rem, eum. Illo facere blanditiis
        iste.
      </page-body>
    </document-page>
  </body>
</html>
```

Template is set as a content to the `Browser.Page` object, so it can be manipulated with JavaScript. Any string with valid HTML markup is accepted. The template is processed and normalized before it is used to generate the PDF document. During this process, the template is checked for errors and any necessary changes are made to ensure that it is valid and can be used to generate the PDF document.

Template should be structured as follows:

- `<body>` should have only `<document-page>` as child element(s)
- `<document-page>` must have only one `<page-body>`:
  - if there are more, they will be ignored
  - if there are none, one will be added during normalization stage and all free elements will be wrapped in it
  - if there is no `page-body` element and nothing to wrap, `<document-page>` will be ignored
- `<document-page>` can have one of each `<page-background>`, `<page-header>` and `<page-footer>` (or none of them)... subsequent ones are ignored
- `<physical-page>` can only be a child of `<page-background>`, `<page-header>` or `<page-footer>` sections
  - sections can have up to four `<physical-page>` elements each, with different `select` attribute values
  - `<physical-page select="...">` can be one of variants: `first`, `last`, `even`, `odd` or `default`, which will define on which page the content will be displayed
- `<current-page-number>` and `<total-pages-number>` will be processed only in `<page-background>`, `<page-header>` and `<page-footer>`, and will be replaced with current page number and total number of pages, respectively

Some good practices to avoid potential headaches:

- it is a good practice to put any number into the `<current-page-number>` or `<total-pages-number>` tags, to avoid any potential issues with layout shifting
- try to avoid using `margin` and `padding` on `<html>`, `<body>` or `<document-page>` as it can lead to unexpected results

## A very important notes on page size (ppi)

When building your template, you should be aware of how the size on the screen will transfer to the size on the paper. By default, the ppi (pixels per inch) is set to 72, which is the default for most screens. This means that 1px on the screen will be 1pt on the paper. It is not possible to change this default value, so you should be aware of it when designing your template.

Luckily, we can get around this limitation by using the `ppi` attribute on the `<document-page>` element. This, however, changes the size of everything on the page, so you should account for it when defining pixel sizes for your elements.

For example, if you set font size to 9px, and you want to print it on A4 paper and be able to read it, your ppi should be 72. Increasing ppi to something like 300 will make the font size of 9px look like ~2.25pt on the paper, which is way too small.

Now, you might think that 72dpi is way too small to print anything meaningful, but it is not. Because of the way the PDF is generated (embedding linked images), elements retain their original dpi. So, when the document is printed, upscaling will be done by the printer, and the quality will be preserved.

There is a limitation, however, and that is when there are embedded graphics in the HTML template (like inline SVGs). During the conversion to pdf process, such elements will be rasterized and then 72ppi will be way too small.

## Document page collection

```html
<document-page format="letter"> ... </document-page>
<document-page format="a4" ppi="72"> ... </document-page>
<document-page size="595x842"> ... </document-page>
<document-page> ... </document-page>
```

Document page is a container for other page sections. There should be no CSS defined for it, as it will be directly inherited by every page section which is probably something that you don't want.

You can set page dimensions either by giving it a `format` attribute or by giving it a `size` attribute. If both are given, `format` takes precedence. Pixels per inch (`ppi`) attribute is 72 by default and matters only if `format` is given. It is used to calculate pixel width and height for every paper format (which are defined in mm).

Default state, when no attributes are given, is `format="a4" ppi="72"`. This is configurable when creating a new DeclarativePDF class.

```ts
// supported formats
type format =
  | 'a0'
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'ledger';

// pixels per inch, used to calculate pixels from format
type ppi = number;

// either width x height (in pixels) or just one number to define both width and height
type size = `${number}x${number}` | number;
```

## Main section - page body

Custom tag: `<page-body>`

The `<page-body>` element should be used as a direct child of the `<document-page>` element. The `<page-body>` element can contain any valid HTML content, including text, images, tables, lists and more. When the template is processed, the content within the `<page-body>` element will span across as many pages as needed of the resulting PDF document.

```html
<document-page>
  <page-body>
    <!-- content goes here -->
  </page-body>
</document-page>
```

The `<page-body>` element is the main element in `<document-page>` and it can be used alone or in conjuction with other custom tags, such as `<page-header>` and `<page-footer>`, to define the layout of the page. The size of this element determines how many pages will there be in resulting PDF.

## Repeating sections

All repeating sections can contain custom tags: `<physical-page>`, `<current-page-number>` and `<total-pages-number>`. They are available only in repeating section, `<page-body>` ignores them. More on these later.

There are three repeating section custom tags: `<page-background>`, `<page-header>` and `<page-footer>`.

All of these custom tags should be used as a direct child of the `<document-page>` element. The order in which you place them in the `<document-pages>` element does not matter, as they will be evaluated and prepared individually for placement on PDF page.

Usage:

```html
<document-page>
  <page-background>
    <!-- background content goes here -->
  </page-background>
  <page-header>
    <physical-page select="first">
      <!-- header content for first physical PDF page goes here -->
    </physical-page>
    <physical-page>
      <!-- header content for other pages goes here -->
      <!-- ignored if only one page -->
    </physical-page>
  </page-header>
  <page-body>
    <!-- body content goes here -->
  </page-body>
  <page-footer>
    <current-page-number></current-page-number> of
    <total-page-number></total-page-number>
    <!-- footer content goes here -->
  </page-footer>
</document-page>
```

### Repeating section elements

#### Background

Custom tag: `<page-background>`

Purpose: The `<page-background>` custom tag is used to define the background color or image for a single page of a PDF document.

Usage:

```html
<document-page>
  <page-background>
    <!-- background content goes here -->
  </page-background>
  <page-body>
    <!-- body content goes here -->
  </page-body>
</document-page>
```

The `<page-background>` element can contain any valid HTML content, including text, images, tables, lists and more, as well as custom tags `<physical-page>`, `<current-page-number>` and `<total-pages-number>`. The content of the `<page-background>` element will be displayed behind the other elements on the page and will be repeated on each page of PDF document.

#### Header

Custom tag: `<page-header>`

Purpose: The `<page-header>` custom tag is used to define the content that appears at the top of each page of a PDF document.

Usage:

```html
<document-page>
  <page-header>
    <!-- header content goes here -->
  </page-header>
  <page-body>
    <!-- body content goes here -->
  </page-body>
</document-page>
```

The `<page-header>` element can contain any valid HTML content, including text, images, tables, lists and more, as well as custom tags `<physical-page>`, `<current-page-number>` and `<total-pages-number>`. The content of the `<page-header>` element will be displayed at the top of each page of the PDF document.

#### Footer

Custom tag: `<page-footer>`

Purpose: The `<page-footer>` custom tag is used to define the content that appears at the bottom of each page of a PDF document.

Usage:

```html
<document-page>
  <page-body>
    <!-- body content goes here -->
  </page-body>
  <page-footer>
    <!-- footer content goes here -->
  </page-footer>
</document-page>
```

The `<page-footer>` element can contain any valid HTML content, including text, images, tables, lists and more, as well as custom tags `<physical-page>`, `<current-page-number>` and `<total-pages-number>`. The content of the `<page-footer>` element will be displayed at the bottom of each page of the PDF document.

### Repeating section special elements

There are three repeating section custom tags: `<physical-page>`, `<current-page-number>` and `<total-pages-number>`. These custom tags are only available in repeating sections: `<page-background>`, `<page-header>` and `<page-footer>`. They are ignored in `<page-body>` section.

#### Physical page

Custom tag: `<physical-page>`

Purpose: The `<physical-page>` custom tag is used within one of the repeating section custom tags to define content that should be displayed on a specific page of the resulting PDF document. This way you can have different footer for first page, different header for last or different page-background for even and odd pages. It is even possible to target specific page number.

Usage:

```html
<page-footer>
  <physical-page select="first">
    <!-- Footer content appearing on first page only -->
  </physical-page>
  <physical-page select="last">
    <!-- Footer content appearing on last page only -->
  </physical-page>
  <physical-page>
    <!-- Default footer content appearing -->
  </physical-page>
</page-footer>
```

```ts
// supported selectors
type select = 'first' | 'last' | 'even' | 'odd';
```

The `<physical-page>` element can have a `select` attribute, which specifies the pages that the content should be displayed on. The `select` attribute can have the following values:

- `first`: displays the content on the first page of `<document-page>` (even if it's not the first page of the PDF document)
- `last`: displays the content on the last page of `<document-page>` (even if it's not the last page of the PDF document)
- `even`: displays the content on even-numbered pages of the PDF document (respecting the numbering across all `<document-page>` elements)
- `odd`: displays the content on odd-numbered pages of the PDF document (respecting the numbering across all `<document-page>` elements)

If the `select` attribute is not present or if it has an invalid value, it will be treated as `default`.

If multiple `<physical-page>` elements are present, the content of the element, applicable for that page, with the highest priority will be displayed. The priority is as follows:

1. `first`
2. `last`
3. `even`
4. `odd`
5. `default`
6. blank

For `<page-header>` and `<page-footer>` it is important to note that their height will be uniform (max height) across all pages within `<document-page>` set. Putting too much content in one specific physical page selector may lead to too much white space on all other pages.

#### Current and total page number

Custom tags: `<current-page-number>`, `<total-pages-number>`

Purpose: The `<current-page-number>` and `<total-pages-number>` custom tags are used to display the current page number and total number of pages, respectively, of the resulting PDF document.

Usage:

```html
<page-header>
  Page <current-page-number>0</current-page-number> of <total-pages-number>0</total-pages-number>
</page-header>
```

The `<current-page-number>` and `<total-pages-number>` custom tags can be treated the same as `<span>` elements. For this purpose, you should style them as `display: inline;`. When the PDF document is generated, their innerHTML will be replaced with the current page number and total number of pages, respectively.

Example:

```html
<html>
  <head>
    <style>
      current-page-number,
      total-pages-number {
        display: inline;
      }
    </style>
  </head>
  <body>
    <document-page>
      <page-body>
        <!-- Imagine some long content here that produces a total of 5 pages -->
      </page-body>
      <page-footer>
        Page <current-page-number>0</current-page-number> of <total-pages-number>0</total-pages-number>
      </page-footer>
    </document-page>
  </body>
</html>
```

So, on 4th page of 5 page document, page numbers would be:

```html
<page-footer>
  Page <current-page-number>4</current-page-number> of <total-pages-number>5</total-pages-number>
</page-footer>
```

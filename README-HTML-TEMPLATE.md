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

> *TODO - body is given `class="pdf"` during normalization stage, explain why and how to use it.*

> Body should have only `<document-page>` as child element(s) and every free element (other than `<script>` or `<style>`) will be wrapped in `<document-page>` during the template normalization stage. Which is, again, probaly something that you don't want.
</details>

# Table of contents
- [Template structure](#template-structure)
- [PDF page size](#pdf-page-size)
- [PDF page margins](#pdf-page-margins)
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

TODO: explain how we have to structure the template, which elements can exist, which can't, give some good examples and some bad ones.

## PDF page size

TODO: explain how is sizing achieved, why you can't use cm as CSS unit (it's absolute, and we're modifiying ppi) and give some possible solutions as examples: calc() and CSS variables.

## PDF page margins

Because every section of the template is evaluated individually, setting PDF margins is hard, m'kay?

TODO: explain on which elements to set margins and how, also why. Give some examples.

## Document page collection

```html
<document-page format="letter"> ... </document-page>
<document-page format="a4" ppi="72"> ... </document-page>
<document-page size="595x842"> ... </document-page>
<document-page> ... </document-page>
```

Document page is a container for other page sections. There should be no CSS defined for it, as it will be directly inherited by every page section which is probably something that you don't want.

You can set page dimensions either by giving it a `format` attribute or by giving it a `size` attribute. If both are given, `format` takes precedence. Pixels per inch (`ppi`) attribute is 72 by default and matters only if `format` is given. It is used to calculate pixel width and height for every paper format (which are defined in mm).

Default state, when no attributes are given, is `format="a4" ppi="72"`.

```ts
// supported formats
type format = 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' |
  'letter' | 'legal' | 'tabloid' | 'ledger';

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
      <!-- header content for any but first page goes here -->
      <!-- ignored if only one page -->
    </physical-page>
  </page-header>
  <page-body>
    <!-- body content goes here -->
  </page-body>
  <page-footer>
    <current-page-number></current-page-number> of <total-page-number></total-page-number>
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
  <div>
    <!-- Footer content that appears on all pages, always -->
  </div>
<page-footer>
```

```ts
// supported selectors
type select = 'first' | 'last' | 'even' | 'odd';
```

The `<physical-page>` element can have a `select` attribute, which specifies the pages that the content should be displayed on. The `select` attribute can have the following values:

- `first`: displays the content on the first page of the PDF document
- `last`: displays the content on the last page of the PDF document
- `even`: displays the content on even-numbered pages of the PDF document
- `odd`: displays the content on odd-numbered pages of the PDF document

If the `select` attribute is not present or if it has an invalid value, the content of the `<physical-page>` element will be treated as the default content for all pages.

If multiple `<physical-page>` elements are present, the content of the element, applicable for that page, with the highest priority will be displayed. The priority is as follows:

1. `first`
2. `last`
3. `even`
4. `odd`
5. default (content of `<physical-page>` element without a `select` attribute)
6. blank

For `<page-header>` and `<page-footer>` it is important to note that their height will be uniform (max height) across all pages within `<document-page>` set. Putting too much content in one specific physical page selector may lead to too much white space on all other pages.

#### Current and total page number

Custom tags: `<current-page-number>`, `<total-pages-number>`

Purpose: The `<current-page-number>` and `<total-pages-number>` custom tags are used to display the current page number and total number of pages, respectively, of the resulting PDF document.

Usage:
```html
<page-header>
  Page <current-page-number>1</current-page-number> of <total-pages-number></total-pages-number>
</page-header>
```

The `<current-page-number>` and `<total-pages-number>` custom tags can be treated the same as `<span>` elements. For this purpose, you should style them as `display: inline;`. When the PDF document is generated, their innerHTML will be replaced with the current page number and total number of pages, respectively.

Example:
```html
<html>
  <head>
    <style>
      current-page-number, total-pages-number {
        display: inline;
      }
    </style>
  </head>
  <body>
    <document-page>
      <page-body>
        /* Imagine some long content here */
        /* that produces a total of 5 pages */
      </page-body>
      <page-footer>
        Page <current-page-number>1</current-page-number>
        of <total-pages-number></total-pages-number>
      </page-footer>
    </document-page>
  </body>
</html>
```

So, on 4th page of 5 page document, page numbers would evaluate to:
```html
      ...
        Page <current-page-number>4</current-page-number>
        of <total-pages-number>5</total-pages-number>
      ...
```

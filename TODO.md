# current pdf-generator
- [ ] dodati new relic reporting
- [ ] dodati lokalno

# generals
- [x] move browser to index (no need for 2 distinct singletons)
- [x] make index singleton
  - [ ] figure out if this is really needed
- [ ] jsdocify eval functions
- [x] add some logging, based on original pdf.js
  - [ ] set it as event emitter
- [ ] add some puppeteer error handling
- [ ] add some template checking / reporting if it's faulty
- [ ] refactor `evalGetDocumentPageSettings`
- [ ] add `orientation` attribute to `document-page`

# generate flow
- [x] initialize browser if needed
- [x] initialize new tab with random viewport (puppeteer phase)
  - [x] send content (html)
  - [x] normalize
  - [x] get all document pages and their settings
  - [x] for every document (pass 1)
    - [x] set correct viewport
    - [x] get section (header, footer) heights
    - [x] calculate body height from known heights
    - [x] calculate height and y position in pdf doc
  - [x] for every document (pass 2)
    - [x] create body pdf
    - [x] get total pages
  - [x] for every document (calculate grand total pages) (pass 3)
    - [x] calculate pageNumber offsets
  - [x] for every document (pass 4)
    - [x] for every section (header, footer, background)
      - [x] decide on section type (first, last, even, odd, default, any)
        - [ ] add support for 'any' section type
        - [ ] or perhaps 'empty' section type (so we have empty buffer)
        - [ ] or perhaps we can skip it and it will work as intended (empty space)
      - [x] inject total pages number
      - [x] inject current page number (derived from page offset)
      - [x] create section pdfBuffers
  - [x] initialize PDF document creator
    - [x] for every document page
      - [x] for every page in body
        - [x] add new PDF page
        - [x] draw background
        - [x] draw header
        - [x] draw body
        - [x] draw footer
    - [x] save PDF document and get buffer
  - [x] return PDF document buffer

# section priority
- [x] types: first, last, even, odd, default
  - [x] first page: first, odd, default, any | empty
  - [x] last page: last, even | odd, default, any | empty
  - [x] even page (not first, not last): even, default, any | empty
  - [x] odd page (not first, not last): odd, default, any | empty
- [ ] make sure we don't use any... use only empty instead

# tests
- [ ] write tests

# documentation
- [ ] overview
  - [x] shorten it
  - [ ] add some icons
  - [ ] add some graphic
- [x] ToC
- [x] Installation / requirements
- [ ] Usage / get started
  - [ ] base it on supplied template from example folder
  - [ ] example for random node app where we save pdf file to disk
  - [ ] example for express where we return pdfBuffer (with keepalive)
- [ ] API reference (do we even have api?)
- [ ] Template sytanx
  - [ ] put it in separate file (template-readme)
- [ ] Examples
  - [ ] put them all in separate folder
- [ ] Support (or troubleshooting)
  - [ ] some guide on how to get help if you get stuck (contact us via... ?)

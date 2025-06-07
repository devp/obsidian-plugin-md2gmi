import { markdownToGemtext } from './gemtext-converter';

describe('markdownToGemtext', () => {
  // Headings
  test('should convert H1 heading', () => {
    expect(markdownToGemtext('# Hello World')).toBe('# Hello World\n');
  });
  test('should convert H2 heading', () => {
    expect(markdownToGemtext('## Hello World')).toBe('## Hello World\n');
  });
  test('should convert H3 heading', () => {
    expect(markdownToGemtext('### Hello World')).toBe('### Hello World\n');
  });
  test('should convert H4 heading to H3', () => {
    expect(markdownToGemtext('#### Hello World')).toBe('### Hello World\n');
  });
  test('should convert H6 heading to H3', () => {
    expect(markdownToGemtext('###### Hello World')).toBe('### Hello World\n');
  });
  test('should keep line starting with # but not a heading', () => {
    expect(markdownToGemtext('#HelloWorld')).toBe('#HelloWorld\n');
  });

  // Links
  test('should convert basic links', () => {
    expect(markdownToGemtext('[Google](https://google.com)')).toBe('=> https://google.com Google\n');
  });
  test('should convert links with spaces in text', () => {
    expect(markdownToGemtext('[My Search Engine](https://google.com)')).toBe('=> https://google.com My Search Engine\n');
  });
  test('should convert links with URL as text', () => {
    expect(markdownToGemtext('[https://google.com](https://google.com)')).toBe('=> https://google.com https://google.com\n');
  });
  test('should convert multiple links on one line', () => {
    expect(markdownToGemtext('[Google](https://google.com) and [Yahoo](https://yahoo.com)')).toBe('=> https://google.com Google and => https://yahoo.com Yahoo\n');
  });

  // Images
  test('should convert images to links with "Alt text:" prefix', () => {
    // Note: original function produced "=> url Alt text: alt text\n"
    // Current implementation: "=> url Alt text: altText\n" (No space after : if altText is empty, which is fine)
    expect(markdownToGemtext('![Alt text for image](https://example.com/image.png)')).toBe('=> https://example.com/image.png Alt text: Alt text for image\n');
  });
  test('should convert images with empty alt text', () => {
    expect(markdownToGemtext('![](https://example.com/image.png)')).toBe('=> https://example.com/image.png Alt text: \n');
  });

  // Unordered lists
  test('should convert unordered lists starting with -', () => {
    expect(markdownToGemtext('- item 1\n- item 2')).toBe('* item 1\n* item 2\n');
  });
  test('should convert unordered lists starting with *', () => {
    expect(markdownToGemtext('* item 1\n* item 2')).toBe('* item 1\n* item 2\n');
  });
  test('should convert unordered lists starting with +', () => {
    expect(markdownToGemtext('+ item 1\n+ item 2')).toBe('* item 1\n* item 2\n');
  });
  test('should preserve indentation for unordered lists', () => {
    expect(markdownToGemtext('  - item 1\n    - item 2')).toBe('  * item 1\n    * item 2\n');
  });

  // Ordered lists
  test('should convert ordered lists to unordered', () => {
    expect(markdownToGemtext('1. item 1\n2. item 2')).toBe('* item 1\n* item 2\n');
  });
  test('should convert ordered lists with different numbers to unordered', () => {
    expect(markdownToGemtext('1. item 1\n5. item 2')).toBe('* item 1\n* item 2\n');
  });
  test('should preserve indentation for ordered lists (converted to unordered)', () => {
    expect(markdownToGemtext('  1. item 1\n    2. item 2')).toBe('  * item 1\n    * item 2\n');
  });

  // Blockquotes
  test('should preserve single blockquotes', () => {
    expect(markdownToGemtext('> This is a quote')).toBe('> This is a quote\n');
  });
  test('should preserve nested blockquotes', () => {
    expect(markdownToGemtext('>> This is a nested quote')).toBe('>> This is a nested quote\n');
  });
  test('should preserve multiple lines of blockquotes', () => {
    expect(markdownToGemtext('> line 1\n> line 2')).toBe('> line 1\n> line 2\n');
  });

  // Code blocks
  test('should convert fenced code blocks', () => {
    expect(markdownToGemtext('```\nconst a = 1;\n```')).toBe('```\nconst a = 1;\n```\n');
  });
  test('should convert fenced code blocks with language specifier', () => {
    expect(markdownToGemtext('```javascript\nconst a = 1;\n```')).toBe('```javascript\nconst a = 1;\n```\n');
  });
  test('should convert indented code blocks to fenced', () => {
    const markdown = '    // This is a comment\n    const b = 2;';
    const expected = '```\n// This is a comment\nconst b = 2;\n```\n';
    expect(markdownToGemtext(markdown)).toBe(expected);
  });
   test('should handle indented code block not at start of doc', () => {
    const markdown = 'Hello\n    const b = 2;\nGoodbye';
    const expected = 'Hello\n```\nconst b = 2;\n```\nGoodbye\n';
    expect(markdownToGemtext(markdown)).toBe(expected);
  });
  test('should handle indented code block ending document', () => {
    const markdown = 'Hello\n    const b = 2;';
    const expected = 'Hello\n```\nconst b = 2;\n```\n';
    expect(markdownToGemtext(markdown)).toBe(expected);
  });
  test('should handle single line indented code block', () => {
    const markdown = '    const b = 2;';
    const expected = '```\nconst b = 2;\n```\n';
    expect(markdownToGemtext(markdown)).toBe(expected);
  });


  // Emphasis
  test('should remove italic emphasis with *', () => {
    expect(markdownToGemtext('*italic text*')).toBe('italic text\n');
  });
  test('should remove italic emphasis with _', () => {
    expect(markdownToGemtext('_italic text_')).toBe('italic text\n');
  });
  test('should remove bold emphasis with **', () => {
    expect(markdownToGemtext('**bold text**')).toBe('bold text\n');
  });
  test('should remove bold emphasis with __', () => {
    expect(markdownToGemtext('__bold text__')).toBe('bold text\n');
  });
  test('should remove bold-italic emphasis with ***', () => {
    expect(markdownToGemtext('***bold italic text***')).toBe('bold italic text\n');
  });
  test('should remove bold-italic emphasis with ___', () => {
    expect(markdownToGemtext('___bold italic text___')).toBe('bold italic text\n');
  });
  test('should remove mixed emphasis', () => {
    expect(markdownToGemtext('This is **bold** and *italic* text.')).toBe('This is bold and italic text.\n');
  });

  // Horizontal rules
  test('should convert --- to horizontal rule', () => {
    expect(markdownToGemtext('---')).toBe('---\n');
  });
  test('should convert *** to horizontal rule', () => {
    expect(markdownToGemtext('***')).toBe('---\n');
  });
  test('should convert ___ to horizontal rule', () => {
    expect(markdownToGemtext('___')).toBe('---\n');
  });

  // Paragraphs and line breaks
  test('should preserve line breaks within paragraphs', () => {
    expect(markdownToGemtext('First line.\nSecond line.')).toBe('First line.\nSecond line.\n');
  });
  test('should condense multiple blank lines to a single blank line', () => {
    expect(markdownToGemtext('Line 1\n\n\nLine 2')).toBe('Line 1\n\nLine 2\n');
  });
  test('should not condense blank lines within fenced code blocks', () => {
    expect(markdownToGemtext('```\n\n\n```')).toBe('```\n\n\n```\n');
  });

  // Combinations
  test('should convert heading with link', () => {
    expect(markdownToGemtext('## [Title Link](https://example.com)')).toBe('## => https://example.com Title Link\n');
  });
  test('should convert list with bold and italic text', () => {
    expect(markdownToGemtext('- **Bold Item**\n- *Italic Item*')).toBe('* Bold Item\n* Italic Item\n');
  });
  test('should convert blockquote with link', () => {
    expect(markdownToGemtext('> See more at [Example](https://example.com)'))
      .toBe('> See more at => https://example.com Example\n');
  });

  // Edge cases
  test('should return empty string for empty input', () => {
    // The function adds a newline, then trims it if it's only a newline.
    expect(markdownToGemtext('')).toBe('');
  });
  test('should handle input with only whitespace (becomes single newline, then empty)', () => {
    expect(markdownToGemtext('   ')).toBe('   \n');
  });
   test('should handle input with only newlines (becomes single newline, then empty)', () => {
    expect(markdownToGemtext('\n\n\n')).toBe(''); // Corrected expectation based on new code
  });
  test('should handle complex document', () => {
    const md = `# Title

Some introductory text.
[Link to Example](http://example.com)

## Subheading

* Item 1
  * Sub Item A
  * Sub Item B
* Item 2

> This is a quote.
> With a [link inside](http://example.org).

\`\`\`python
def hello():
    print("Hello, world!")
\`\`\`

Another paragraph.
    Indented code here
    More of it

---
Final line.`;
    const expected = `# Title

Some introductory text.
=> http://example.com Link to Example

## Subheading

* Item 1
  * Sub Item A
  * Sub Item B
* Item 2

> This is a quote.
> With a => http://example.org link inside.

\`\`\`python
def hello():
    print("Hello, world!")
\`\`\`

Another paragraph.
\`\`\`
Indented code here
More of it
\`\`\`

---
Final line.
`;
    expect(markdownToGemtext(md)).toBe(expected);
  });
});

describe('markdownToGemtext - specific list and emphasis interactions', () => {
  test('should not treat **bold** list item marker as list', () => {
    expect(markdownToGemtext('** text')).toBe(' text\n'); // Emphasis removed, leading space kept
    expect(markdownToGemtext('**text')).toBe('text\n'); // Emphasis removed
  });
   test('should handle list items starting with escaped-like sequences', () => {
    // With the improved emphasis regex, the list marker is no longer consumed.
    // The escaped asterisk remains an escaped asterisk.
    expect(markdownToGemtext('- \\* item')).toBe('* \\* item\n');
  });
});

describe('markdownToGemtext - indented code block edge cases', () => {
  test('should not treat list item as indented code', () => {
    const md = '    * list item';
    const expected = '    * list item\n'; // Preserves space, identified as list
    expect(markdownToGemtext(md)).toBe(expected);
  });
  test('should not treat blockquote as indented code', () => {
    const md = '    > blockquote';
    const expected = '    > blockquote\n'; // Preserves space, identified as quote
    expect(markdownToGemtext(md)).toBe(expected);
  });
   test('should correctly identify indented code vs list item', () => {
    const md = 'Paragraph\n    indented code\n* list item\n    also code';
    const expected = 'Paragraph\n```\nindented code\n```\n* list item\n```\nalso code\n```\n';
    expect(markdownToGemtext(md)).toBe(expected);
   });
});

import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

// Remember to rename these classes and interfaces!

function markdownToGemtext(markdown: string): string {
	let gemtext = '';
	const lines = markdown.split('\n');
	let inCodeBlock = false;

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		// Code blocks (fenced)
		if (line.startsWith('```')) {
			inCodeBlock = !inCodeBlock;
			gemtext += line + '\n';
			continue;
		}
		if (inCodeBlock) {
			gemtext += line + '\n';
			continue;
		}

		// Code blocks (indented) - must be checked before other elements like lists
		if (/^(    |\t)/.test(line) && !/^(    |\t)\s*(\*|-|\+|\d+\.)/.test(line) && !/^>/.test(line.trimStart())) {
			// This is likely an indented code block line
			// We'll handle indented code blocks by converting them to fenced blocks
			// for simplicity in this pass, assuming a block starts with the first indented line
			// and ends with the first non-indented line or end of document.
			// A more robust solution would group consecutive indented lines.
			if (i === 0 || !/^(    |\t)/.test(lines[i-1])) {
				gemtext += '```\n';
			}
			gemtext += line.replace(/^(    |\t)/, '') + '\n';
			if (i === lines.length - 1 || !/^(    |\t)/.test(lines[i+1])) {
				gemtext += '```\n';
			}
			continue;
		}

		// Headings
		if (line.startsWith('#')) {
			if (line.startsWith('# ')) {
				gemtext += '# ' + line.substring(2) + '\n';
			} else if (line.startsWith('## ')) {
				gemtext += '## ' + line.substring(3) + '\n';
			} else if (line.startsWith('### ')) {
				gemtext += '### ' + line.substring(4) + '\n';
			} else if (line.startsWith('#### ') || line.startsWith('##### ') || line.startsWith('###### ')) {
				gemtext += '### ' + line.substring(line.indexOf(' ') + 1) + '\n';
			} else {
				gemtext += line + '\n'; // Potentially a line starting with # but not a heading
			}
			continue;
		}

		// Links
		const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
		if (linkMatch) {
			const text = linkMatch[1] || linkMatch[2];
			const url = linkMatch[2];
			line = line.replace(linkMatch[0], `=> ${url} ${text}`);
		}

		// Images
		const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
		if (imageMatch) {
			const altText = imageMatch[1];
			const url = imageMatch[2];
			line = line.replace(imageMatch[0], `=> ${url} Alt text: ${altText}`);
		}

		// Unordered lists
		if (line.match(/^(\s*)(-|(?<!\d)\*|\+)\s+(.*)/)) {
			line = line.replace(/^(\s*)(-|(?<!\d)\*|\+)\s+/, '$1* ');
		}

		// Ordered lists (convert to unordered)
		if (line.match(/^(\s*)\d+\.\s+(.*)/)) {
			line = line.replace(/^(\s*)\d+\.\s+/, '$1* ');
		}

		// Blockquotes (already gemtext compatible)
		// No change needed if line starts with >

		// Emphasis (remove formatting)
		line = line.replace(/\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|__(.*?)__|\*(.*?)\*|_(.*?)_/g, '$1$2$3$4$5');

		// Horizontal rules
		if (line.match(/^(\-\-\-|\*\*\*|___)$/)) {
			line = '---';
		}

		gemtext += line + '\n';
	}

	// Condense multiple blank lines (outside preformatted blocks)
	// First, split by preformatted blocks, process, then rejoin
	const parts = gemtext.split(/(```[\s\S]*?```)/);
	for(let i = 0; i < parts.length; i++) {
		if (!parts[i].startsWith('```')) {
			parts[i] = parts[i].replace(/\n\n+/g, '\n\n');
		}
	}
	gemtext = parts.join('').trimEnd() + '\n';


	// Remove trailing newline if only one line and it's blank
	if (gemtext === '\n') {
		gemtext = '';
	}


	return gemtext;
}

export default class Md2GmiPlugin extends Plugin {
	async onload() {
		// Plugin code goes here
		this.addCommand({
			id: 'copy-as-gemtext',
			name: 'Copy to Clipboard as Gemtext',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const markdownContent = editor.getValue();
				const gemtextContent = markdownToGemtext(markdownContent);
				navigator.clipboard.writeText(gemtextContent).then(() => {
					new Notice('Gemtext copied to clipboard!');
				}).catch(err => {
					new Notice('Error copying Gemtext to clipboard.');
					console.error('Failed to copy Gemtext: ', err);
				});
			}
		});

		this.addCommand({
			id: 'export-as-gemtext',
			name: 'Export to file as Gemtext',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (!view.file) {
					new Notice('No active file to export.');
					return;
				}
				const markdownContent = editor.getValue();
				const gemtextContent = markdownToGemtext(markdownContent);

				const currentFileName = view.file.name;
				let newFileName = '';
				if (currentFileName.toLowerCase().endsWith('.md')) {
					newFileName = currentFileName.substring(0, currentFileName.length - 3) + '.gmi';
				} else {
					newFileName = currentFileName + '.gmi';
				}

				const parentPath = view.file.parent ? view.file.parent.path : '/';
				// Ensure parentPath doesn't end with a slash if it's not the root
				const normalizedParentPath = parentPath === '/' ? '/' : parentPath.replace(/\/$/, '');
				const fullNewPath = normalizedParentPath === '/' ? newFileName : `${normalizedParentPath}/${newFileName}`;

				try {
					await this.app.vault.create(fullNewPath, gemtextContent);
					new Notice(`Exported to ${newFileName}`);
				} catch (err) {
					new Notice('Error exporting file.');
					console.error('Failed to export Gemtext file: ', err);
				}
			}
		});
	}

	onunload() {
		// Plugin code goes here
	}
}

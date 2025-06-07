import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { markdownToGemtext } from '../lib/gemtext-converter';

// Remember to rename these classes and interfaces!

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

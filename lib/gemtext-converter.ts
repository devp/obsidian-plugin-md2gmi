export function markdownToGemtext(markdown: string): string {
	const lines = markdown.split('\n');
	const outputLines: string[] = [];
	let inCodeBlock = false;
	let codeBlockType: 'fenced' | 'indented' | null = null;
	let currentCodeBlockContent: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		// Fenced Code Blocks
		if (line.startsWith('```')) {
			if (inCodeBlock && codeBlockType === 'fenced') {
				outputLines.push(line); // Closing ```
				inCodeBlock = false;
				codeBlockType = null;
			} else if (!inCodeBlock) {
				inCodeBlock = true;
				codeBlockType = 'fenced';
				outputLines.push(line); // Opening ```
			} else { // in indented code block, ``` is content
				outputLines.push(line);
			}
			continue;
		}

		if (inCodeBlock && codeBlockType === 'fenced') {
			outputLines.push(line);
			continue;
		}

		// Indented Code Blocks
		// A line is part of an indented code block if it starts with 4 spaces or a tab,
		// AND it's not already part of a list or blockquote that might also be indented.
		const isIndented = /^(    |\t)/.test(line);
		const isListItem = /^(    |\t)*(\*|-|\+|\d+\.)\s/.test(line.trimStart()); // check original line for list marker
		const isBlockQuote = /^(    |\t)*>/.test(line.trimStart()); // check original line for blockquote marker

		if (!inCodeBlock && isIndented && !isListItem && !isBlockQuote) {
			inCodeBlock = true;
			codeBlockType = 'indented';
			currentCodeBlockContent.push(line.replace(/^(    |\t)/, ''));
			if (i === 0 || !/^(    |\t)/.test(lines[i-1]) || /^(    |\t)*(\*|-|\+|\d+\.)\s/.test(lines[i-1].trimStart()) || /^(    |\t)*>/.test(lines[i-1].trimStart()) ) {
                 // Previous line was not part of an indented block
            }
			continue;
		}

		if (inCodeBlock && codeBlockType === 'indented') {
			if (isIndented && !isListItem && !isBlockQuote) {
				currentCodeBlockContent.push(line.replace(/^(    |\t)/, ''));
				if (i < lines.length -1) continue; // only process block at end of lines or when indent broken
			}
			// End of indented block or end of document
			outputLines.push('```');
			outputLines.push(...currentCodeBlockContent);
			outputLines.push('```');
			currentCodeBlockContent = [];
			inCodeBlock = false;
			codeBlockType = null;
			// The current line (which broke the indent) still needs processing
			if (!isIndented || isListItem || isBlockQuote) {
				// Fall through to process this line normally if it broke the indent
			} else {
				continue; // Current line was last line of indented block
			}
		}


		// Horizontal Rules (must be checked before emphasis)
		if (/^(\-\-\-|\*\*\*|___)$/.test(line.trim())) { // trim to allow leading/trailing spaces for HR
			outputLines.push('---');
			continue;
		}

		// Headings
		if (line.startsWith('#')) {
			if (line.startsWith('# ')) {
				line = '# ' + line.substring(2);
			} else if (line.startsWith('## ')) {
				line = '## ' + line.substring(3);
			} else if (line.startsWith('### ')) {
				line = '### ' + line.substring(4);
			} else if (line.startsWith('#### ') || line.startsWith('##### ') || line.startsWith('###### ')) {
				line = '### ' + line.substring(line.indexOf(' ') + 1);
			}
			// else: it's a line starting with # but not a heading, process as normal text
		}

		// Images (must be processed before links)
		let imageMatch;
		while ((imageMatch = /!\[(.*?)\]\((.*?)\)/.exec(line)) !== null) {
			const altText = imageMatch[1];
			const url = imageMatch[2];
			line = line.replace(imageMatch[0], `=> ${url} Alt text: ${altText}`);
		}

		// Links
		let linkMatch;
		while ((linkMatch = /\[(.*?)\]\((.*?)\)/.exec(line)) !== null) {
			const text = linkMatch[1] || linkMatch[2]; // Use URL if text is empty
			const url = linkMatch[2];
			line = line.replace(linkMatch[0], `=> ${url} ${text}`);
		}

		// Blockquotes (Gemtext is line-oriented, so > at start is fine)
		// No specific transformation needed unless we wanted to strip > for non-blockquote lines.
		// The current logic implicitly preserves them if they are there.

		// Lists
		const listItemMatch = line.match(/^(\s*)(-|(?<!\d)\*|\+)\s+(.*)/);
		if (listItemMatch) {
			const indent = listItemMatch[1];
			const content = listItemMatch[3];
			line = `${indent}* ${content}`;
		} else {
			const orderedListItemMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
			if (orderedListItemMatch) {
				const indent = orderedListItemMatch[1];
				const content = orderedListItemMatch[2];
				line = `${indent}* ${content}`;
			}
		}

		// Emphasis (remove formatting)
		// Order: ***, ___, **, __, *, _
		// (?!\s) ensures the opening marker is not followed by a space.
		// (?<!\s) ensures the closing marker is not preceded by a space.
		// This helps distinguish from list markers followed by spaces, e.g. `* item` vs `*item*`
		line = line.replace(
			/\*\*\*(?!\s)(.*?)(?<!\s)\*\*\*|___(?!\s)(.*?)(?<!\s)___|\*\*(?!\s)(.*?)(?<!\s)\*\*|__(?!\s)(.*?)(?<!\s)__|\*(?!\s)(.*?)(?<!\s)\*|_(?!\s)(.*?)(?<!\s)_/g,
			(match, g1, g2, g3, g4, g5, g6) => {
				// Only one of these groups will be defined for any given match
				return g1 || g2 || g3 || g4 || g5 || g6 || '';
			}
		);

		outputLines.push(line);
	}

    // If an indented code block was open until the end of the document
    if (inCodeBlock && codeBlockType === 'indented' && currentCodeBlockContent.length > 0) {
        outputLines.push('```');
        outputLines.push(...currentCodeBlockContent);
        outputLines.push('```');
    }


	// Post-processing: Condense multiple blank lines (outside preformatted blocks)
	let finalOutput = '';
	let inOutputCodeBlock = false;
	for (const outLine of outputLines) {
		if (outLine.startsWith('```')) {
			inOutputCodeBlock = !inOutputCodeBlock;
			finalOutput += outLine + '\n';
		} else if (inOutputCodeBlock) {
			finalOutput += outLine + '\n';
		} else {
			if (outLine.trim() === '' && finalOutput.endsWith('\n\n')) {
				// Skip adding this blank line if the last two chars are already newlines
			} else {
				finalOutput += outLine + '\n';
			}
		}
	}

    // Condense multiple blank lines again after all lines are added.
    // Split by preformatted blocks, process, then rejoin
    const parts = finalOutput.split(/(```[\s\S]*?```)/);
    for(let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('```')) {
            // Replace 3 or more newlines with two, effectively condensing multiple blanks to one
            parts[i] = parts[i].replace(/\n{3,}/g, '\n\n');
        }
    }
    let processedGemtext = parts.join('');

	// Remove single trailing newline if string ends with it, but not if it's just "\n"
    if (processedGemtext.endsWith('\n') && processedGemtext !== '\n') {
        processedGemtext = processedGemtext.substring(0, processedGemtext.length - 1);
    }

    // Special case: if the entire output is just a newline (e.g. from input like "\n\n"), make it empty.
    // Or if input was empty string.
    if (processedGemtext === '\n' && (markdown.trim() === '' || markdown === '\n')) {
        processedGemtext = '';
    }
    // Add one trailing newline if not empty, as per original function's behavior for non-empty output.
    if (processedGemtext !== '') {
         processedGemtext += '\n';
    }


	return processedGemtext;
}

// These will be global from the CDN scripts in index.html
declare var pdfjsLib: any;
declare var JSZip: any;

/**
 * Parses the uploaded file and returns its text content.
 * @param file The File object to parse.
 * @returns A promise that resolves with the extracted text content.
 */
export async function parseFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
        return parsePdf(file);
    } else if (extension === 'pptx') {
        return parsePptx(file);
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or PPTX file.');
    }
}

/**
 * Extracts text from a PDF file.
 * @param file The PDF File object.
 * @returns A promise that resolves with the extracted text.
 */
async function parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((s: any) => s.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText.trim();
}

/**
 * Extracts text from a PPTX file.
 * @param file The PPTX File object.
 * @returns A promise that resolves with the extracted text.
 */
async function parsePptx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slidePromises: Promise<string>[] = [];

    // Find all slide XML files
    zip.folder('ppt/slides')?.forEach((relativePath, file) => {
        if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
            slidePromises.push(file.async('string'));
        }
    });

    const slideXmls = await Promise.all(slidePromises);
    let fullText = '';
    const parser = new DOMParser();

    slideXmls.forEach(xmlString => {
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        // 'a:t' is the tag for text runs in DrawingML
        const textNodes = xmlDoc.querySelectorAll('a\\:t');
        textNodes.forEach(node => {
            if (node.textContent) {
                fullText += node.textContent + ' ';
            }
        });
        fullText += '\n\n';
    });

    return fullText.trim();
}

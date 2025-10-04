
import { Slide, Page, DocumentType } from '../types';

// These are global variables exposed by the scripts in index.html
declare var PptxGenJS: any;
declare var docx: any;
declare var html2pdf: any;

/**
 * Helper function to get the dimensions of a base64 encoded image.
 * @param base64 The base64 string of the image (without the data URL prefix).
 * @returns A promise that resolves with the image's width and height.
 */
const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        if (!base64 || base64.length < 20) { // Simple check for a plausible base64 string
            return reject(new Error("Invalid or empty base64 string provided for image."));
        }
        const img = new Image();
        img.onload = () => {
            if (img.width === 0 || img.height === 0) {
                return reject(new Error("Image loaded successfully but has zero dimensions."));
            }
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = (err) => {
            console.error("Failed to load image for dimension check", err);
            reject(new Error("Could not load image data from base64 string. It might be corrupted."));
        };
        img.src = `data:image/jpeg;base64,${base64}`;
    });
};

/**
 * Converts a base64 string to an ArrayBuffer, which is a required format for the docx library in the browser.
 * @param base64 The base64 string.
 * @returns The corresponding ArrayBuffer.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};


export const exportAsPPTX = (slides: Slide[], generatedImages: Record<number, string>, fileName: string = 'presentation.pptx') => {
    if (typeof PptxGenJS === 'undefined') {
        alert('PptxGenJS library is not loaded.');
        return;
    }
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';

    slides.forEach((slideData, index) => {
        const slide = pres.addSlide();
        slide.addText(slideData.title, { x: 0.5, y: 0.25, w: '90%', h: 1, fontSize: 32, bold: true, color: '363636' });
        
        const imageBase64 = generatedImages[index];
        const hasImage = !!imageBase64;

        const bulletPoints = slideData.content.map(point => ({ text: point }));
        const textOptions = { 
            x: 0.5, 
            y: 1.5, 
            w: hasImage ? '45%' : '90%', // Adjust text width if image exists
            h: 4, 
            fontSize: 18, 
            bullet: true, 
            color: '494949' 
        };
        slide.addText(bulletPoints, textOptions);
        
        if (hasImage) {
            slide.addImage({
                data: `data:image/jpeg;base64,${imageBase64}`,
                x: '52%',
                y: 1.5,
                w: '45%',
                h: 4,
            });
        }
        
        if (slideData.notes) {
            slide.addNotes(slideData.notes);
        }
    });

    pres.writeFile({ fileName });
};

export const exportAsDOCX = async (pages: Page[], generatedImages: Record<number, string>, fileName: string = 'document.docx') => {
    try {
        if (typeof docx === 'undefined') {
            throw new Error('The "docx" library is not loaded. Cannot export.');
        }
        if (!pages || pages.length === 0) {
            throw new Error('There is no content to export.');
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, PageSize, convertInchesToTwip, WidthType } = docx;
        
        const children = [];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            if (page.title && page.title.trim() !== '') {
                children.push(new Paragraph({
                    text: page.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 240 },
                }));
            }

            const imageBase64 = generatedImages[i];
            if (imageBase64) {
                try {
                    const imageBuffer = base64ToArrayBuffer(imageBase64);
                    const dimensions = await getImageDimensions(imageBase64);
                    
                    const MAX_WIDTH_INCHES = 6.5; // A4 page width with 1" margins
                    const aspectRatio = dimensions.height / dimensions.width;
                    const widthInTwips = convertInchesToTwip(MAX_WIDTH_INCHES);
                    const heightInTwips = widthInTwips * aspectRatio;

                    children.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: widthInTwips,
                                    height: heightInTwips,
                                },
                            }),
                        ],
                        spacing: { after: 120 },
                    }));
                } catch (error) {
                    console.error(`Could not process or add image to DOCX for page ${i + 1}:`, error);
                    // Add a placeholder in the document so the export doesn't fail silently
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `[Image failed to load: ${page.imagePrompt || 'Untitled'}]`, italics: true })],
                        spacing: { after: 120 },
                    }));
                }
            }
            
            if (page.content && page.content.length > 0) {
                page.content.forEach(p => {
                    if (p && p.trim() !== '') {
                        children.push(new Paragraph({
                            children: [new TextRun(p)],
                            spacing: { after: 120 },
                        }));
                    }
                });
            }
             // Add a bit more space after each "page" section
            children.push(new Paragraph({ text: "", spacing: { after: 240 } }));
        }

        const doc = new Document({
            sections: [{
                properties: {
                    pageSize: {
                        width: PageSize.A4.width,
                        height: PageSize.A4.height,
                        orientation: PageSize.A4.orientation,
                    },
                },
                children: children,
            }],
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        }).catch(err => {
            console.error("DOCX Packer failed:", err);
            alert("A critical error occurred while building the DOCX file. The content may be incompatible.");
        });

    } catch (error) {
        console.error("Failed to create DOCX file:", error);
        alert(`An unexpected error occurred during DOCX export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const exportAsPDF = (fileName: string, docType: DocumentType) => {
    if (typeof html2pdf === 'undefined') {
        alert('html2pdf library is not loaded.');
        return;
    }
    const element = document.getElementById('preview-container');
    if (!element) {
        alert('Could not find preview content to export.');
        return;
    }
    
    const isPresentation = docType === DocumentType.PRESENTATION;

    const opt = {
      margin:       isPresentation ? 0 : [0.5, 0.5, 0.5, 0.5], // Generous margins for documents
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: isPresentation ? 'landscape' : 'portrait' },
      // Smart page breaks: avoid breaking inside elements and break after each document page
      pagebreak:    isPresentation ? { mode: 'avoid-all' } : { mode: ['avoid-all', 'css'], after: '.page-preview-item' }
    };

    if (isPresentation) {
        element.classList.add('pdf-export-mode');
    }

    html2pdf().from(element).set(opt).save().then(() => {
        if (isPresentation) {
            element.classList.remove('pdf-export-mode');
        }
    }).catch((error: Error) => {
        console.error("PDF export failed:", error);
        alert("Sorry, there was an error creating the PDF file.");
        if (isPresentation) {
            element.classList.remove('pdf-export-mode');
        }
    });
};

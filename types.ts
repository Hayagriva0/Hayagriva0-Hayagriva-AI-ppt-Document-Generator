
export enum DocumentType {
  PRESENTATION = 'PRESENTATION',
  DOCUMENT = 'DOCUMENT',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

// New types for templates, charts, and enhanced content
export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartData {
  type: ChartType;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export type FontFamily = 'Inter' | 'Roboto' | 'Lato' | 'Montserrat' | 'Poppins' | 'Merriweather' | 'Playfair Display' | 'Raleway' | 'Nunito';

export interface Template {
  id: string;
  name: string;
  colors: ColorPalette;
  font: FontFamily;
}

// Updated content types
export interface Slide {
  title: string;
  content: string[];
  notes?: string;
  imagePrompt?: string;
  chart?: ChartData;
}

export interface Page {
  title: string;
  content: string[];
  imagePrompt?: string;
  chart?: ChartData;
}

export type GeneratedItem = Slide | Page;
export type GeneratedContent = GeneratedItem[];
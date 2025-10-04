
import { Template, FontFamily } from './types';

export const FONTS: { id: FontFamily; name: string }[] = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Lato', name: 'Lato' },
  { id: 'Montserrat', name: 'Montserrat' },
  { id: 'Poppins', name: 'Poppins' },
  { id: 'Nunito', name: 'Nunito' },
  { id: 'Raleway', name: 'Raleway' },
  { id: 'Merriweather', name: 'Merriweather' },
  { id: 'Playfair Display', name: 'Playfair Display' },
];

export const TEMPLATES: Template[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    colors: {
      primary: '#005A9C',
      secondary: '#003366',
      accent: '#E87722',
      background: '#F0F4F7',
      text: '#333333',
    },
    font: 'Inter',
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    colors: {
      primary: '#1E8449',
      secondary: '#145A32',
      accent: '#F1C40F',
      background: '#F4F6F6',
      text: '#212F3C',
    },
    font: 'Roboto',
  },
    {
    id: 'startup-orange',
    name: 'Startup Orange',
    colors: {
      primary: '#E67E22',
      secondary: '#D35400',
      accent: '#3498DB',
      background: '#FDFEFE',
      text: '#17202A',
    },
    font: 'Poppins',
  },
  {
    id: 'creative-purple',
    name: 'Creative Purple',
    colors: {
        primary: '#8E44AD',
        secondary: '#5B2C6F',
        accent: '#F39C12',
        background: '#FDFAF2',
        text: '#4A235A',
    },
    font: 'Raleway',
  },
    {
    id: 'oceanic-teal',
    name: 'Oceanic Teal',
    colors: {
      primary: '#16A085',
      secondary: '#117A65',
      accent: '#E74C3C',
      background: '#F2F4F4',
      text: '#212F3C',
    },
    font: 'Nunito',
  },
    {
    id: 'academic',
    name: 'Academic',
    colors: {
      primary: '#2C3E50',
      secondary: '#000000',
      accent: '#B03A2E',
      background: '#FAFAFA',
      text: '#212121',
    },
    font: 'Merriweather',
  },
  {
    id: 'minimalist-gray',
    name: 'Minimalist Gray',
    colors: {
        primary: '#5D6D7E',
        secondary: '#34495E',
        accent: '#1ABC9C',
        background: '#FFFFFF',
        text: '#2C3E50',
    },
    font: 'Montserrat',
  },
];
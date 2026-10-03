import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Favicon & Shell Metadata Verification', () => {
  const publicFaviconPath = path.resolve(process.cwd(), 'public/favicon.svg');
  const indexHtmlPath = path.resolve(process.cwd(), 'index.html');

  describe('Favicon Existence & SVG Integrity', () => {
    it('verifies public/favicon.svg exists', () => {
      expect(fs.existsSync(publicFaviconPath)).toBe(true);
    });

    it('verifies SVG contents and structure', () => {
      const svgContent = fs.readFileSync(publicFaviconPath, 'utf-8');

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('viewBox="0 0 32 32"');
      expect(svgContent).toContain('</svg>');
    });

    it('contains brand linear gradient with #4f46e5 and #9333ea colors', () => {
      const svgContent = fs.readFileSync(publicFaviconPath, 'utf-8');

      expect(svgContent).toContain('<linearGradient id="brandGradient"');
      expect(svgContent).toContain('#4f46e5');
      expect(svgContent).toContain('#9333ea');
    });

    it('contains rounded background rect and Lucide Dices icon geometry', () => {
      const svgContent = fs.readFileSync(publicFaviconPath, 'utf-8');

      expect(svgContent).toContain('<rect width="32" height="32" rx="6" fill="url(#brandGradient)"');
      expect(svgContent).toContain('transform="translate(4, 4)"');
      expect(svgContent).toContain('<rect x="2" y="10" width="12" height="12" rx="2"');
      expect(svgContent).toContain('d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"');
    });
  });

  describe('HTML Metadata Integration', () => {
    it('verifies index.html exists', () => {
      expect(fs.existsSync(indexHtmlPath)).toBe(true);
    });

    it('contains favicon link tag in index.html', () => {
      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

      expect(htmlContent).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    });

    it('contains theme-color meta tag in index.html', () => {
      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

      expect(htmlContent).toContain('<meta name="theme-color" content="#4f46e5" />');
    });
  });
});

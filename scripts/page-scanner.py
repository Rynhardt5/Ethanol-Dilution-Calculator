#!/usr/bin/env python3
"""
Page scanner to find pages with herb content
"""

import pdfplumber
import re

def scan_pages_for_herbs(pdf_path, start_page=50, end_page=70):
    """Scan pages to find which ones contain herb entries"""
    print(f"Scanning pages {start_page} to {end_page} for herb content...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num in range(start_page - 1, min(end_page, len(pdf.pages))):
            page = pdf.pages[page_num]
            
            # Try different extraction methods
            simple_text = page.extract_text()
            layout_text = page.extract_text(layout=True)
            
            print(f"\n=== PAGE {page_num + 1} ===")
            
            # Check for Latin names
            latin_matches = []
            if simple_text:
                latin_matches.extend(re.findall(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', simple_text))
            if layout_text:
                latin_matches.extend(re.findall(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', layout_text))
            
            if latin_matches:
                print(f"Found {len(latin_matches)} potential herb entries:")
                for latin, family in latin_matches:
                    print(f"  - {latin} ({family})")
            else:
                print("No herb entries found")
            
            # Show first 200 characters of text
            text_sample = simple_text[:200] if simple_text else layout_text[:200] if layout_text else "No text"
            print(f"Text sample: {text_sample}...")

def main():
    pdf_path = 'herbs.pdf'
    scan_pages_for_herbs(pdf_path, 50, 70)

if __name__ == "__main__":
    main()

"""
core/pdf_parser.py – PDF text extraction using pdfplumber.
Handles multi-page PDFs, tables, malformed fonts gracefully.
"""

import os
import sys

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


class PDFParser:
    """Extract raw text from PDF resume files."""

    @staticmethod
    def extract_text(pdf_path: str) -> str:
        """
        Extract all text from a PDF file.
        Falls back gracefully on corrupt / encrypted PDFs.
        """
        if pdfplumber is None:
            raise ImportError(
                "pdfplumber is required.  Install via:  pip install pdfplumber"
            )

        if not os.path.isfile(pdf_path):
            return ""

        text_parts = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)

                    # Also attempt to extract tables and flatten them
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            for row in table:
                                if row:
                                    cells = [
                                        str(c).strip()
                                        for c in row
                                        if c is not None
                                    ]
                                    if cells:
                                        text_parts.append("  ".join(cells))
        except Exception as e:
            # Log but don't crash – some PDFs may be partially corrupt
            sys.stderr.write(f"[PDFParser] Warning for {pdf_path}: {e}\n")

        raw = "\n".join(text_parts)
        return PDFParser._clean(raw)

    @staticmethod
    def _clean(text: str) -> str:
        """Basic whitespace / encoding cleanup."""
        import re

        # Collapse multiple blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Collapse multiple spaces
        text = re.sub(r"[ \t]{2,}", " ", text)
        return text.strip()

    @staticmethod
    def batch_extract(pdf_paths: list) -> list:
        """
        Extract text from multiple PDFs.
        Returns list of dicts: [{path, filename, text}, ...]
        """
        results = []
        for p in pdf_paths:
            text = PDFParser.extract_text(p)
            results.append({
                "path": p,
                "filename": os.path.basename(p),
                "text": text,
            })
        return results

"""
Milo doc builder — reusable helpers for producing AEM/DA-compatible .docx files.

Each block in a Milo doc is a bordered table with a merged gray header row
showing the block name, then 2-column content rows. Sections are separated by a
horizontal "section break" marker.

Typical feature authoring flow:
    from .claude.tools.build_milo_doc import (
        Document, add_block, add_section_break, add_runs,
    )
    from docx.shared import Cm, Pt

    doc = Document()
    for s in doc.sections:
        s.left_margin = s.right_margin = s.top_margin = s.bottom_margin = Cm(1.5)

    add_block(doc, 'frictionless-quick-action', [
        [HEADER_CELL_CONTENT],                       # merged row spanning cols
        [LEFT_CELL, RIGHT_CELL],                     # 2-col row
        [[('p', [('text', 'Quick-Action')])], [('p', [('text', 'edit-video')])]],
    ], col_widths=[3.3, 3.3])

    add_block(doc, 'section-metadata',
              [[[('p', [('text', 'showwith')])], [('p', [('text', 'fqa-qualified-desktop')])]]],
              col_widths=[3.3, 3.3])

    add_section_break(doc)
    doc.save('page.docx')

Dependencies (install via pip, not brew):
    pip install python-docx requests
"""
import io
import requests
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HEADER_FILL = "EFEFEF"
BORDER_COLOR = "D0D0D0"
LINK_COLOR = "1473E6"

# ----- low-level helpers ---------------------------------------------------

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)


def set_cell_borders(cell, color=BORDER_COLOR, sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ("top", "left", "bottom", "right"):
        b = OxmlElement(f'w:{edge}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tcBorders.append(b)
    tcPr.append(tcBorders)


def set_table_borders(table, color=BORDER_COLOR, sz="4"):
    tbl = table._tbl
    tblPr = tbl.find(qn('w:tblPr'))
    tblBorders = OxmlElement('w:tblBorders')
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f'w:{edge}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), sz)
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tblBorders.append(b)
    tblPr.append(tblBorders)


def merge_row_cells(table, row_idx):
    """Merge all cells in a row into one."""
    row = table.rows[row_idx]
    first = row.cells[0]
    for c in row.cells[1:]:
        first = first.merge(c)
    return first


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    r_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), LINK_COLOR)
    rPr.append(color)
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    new_run.append(rPr)
    t = OxmlElement('w:t')
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink


def add_runs(paragraph, parts):
    """parts = list of tuples:
        ('text', str)
        ('em', str)           — italic
        ('link', text, url)
        ('br',)               — line break
    """
    for p in parts:
        kind = p[0]
        if kind == 'text':
            paragraph.add_run(p[1])
        elif kind == 'em':
            r = paragraph.add_run(p[1])
            r.italic = True
        elif kind == 'link':
            add_hyperlink(paragraph, p[1], p[2])
        elif kind == 'br':
            paragraph.add_run().add_break()


def write_cell(cell, content_blocks, bold_all=False):
    """content_blocks: list of blocks. Each block is one of:
        ('p', parts)            — paragraph (parts passed to add_runs)
        ('h', level, text)      — heading (level 1/2/3 → size 20/16/13pt, bold)
        ('ul', [items])         — bulleted list (each item is a parts list)
        ('img', url, alt)       — image fetched from url; falls back to [image: alt] on error
    """
    cell.text = ""
    first = True
    for block in content_blocks:
        if first:
            p = cell.paragraphs[0]
            first = False
        else:
            p = cell.add_paragraph()
        kind = block[0]
        if kind == 'p':
            parts = block[1]
            add_runs(p, parts)
            for run in p.runs:
                if bold_all:
                    run.bold = True
        elif kind == 'h':
            level, text = block[1], block[2]
            run = p.add_run(text)
            run.bold = True
            if level == 1:
                run.font.size = Pt(20)
            elif level == 2:
                run.font.size = Pt(16)
            elif level == 3:
                run.font.size = Pt(13)
        elif kind == 'ul':
            items = block[1]
            for i, item_parts in enumerate(items):
                lp = p if i == 0 else cell.add_paragraph()
                lp.style = cell.part.document.styles['List Bullet']
                add_runs(lp, item_parts)
        elif kind == 'img':
            url, alt = block[1], block[2]
            try:
                data = requests.get(url, timeout=20).content
                stream = io.BytesIO(data)
                run = p.add_run()
                run.add_picture(stream, width=Inches(2.6))
            except Exception:
                r = p.add_run(f"[image: {alt}]")
                r.italic = True


# ----- block builders ------------------------------------------------------

def add_block(doc, name, rows, col_widths=None):
    """
    Write a Milo block as a bordered table with a gray header row.

    name        — block name shown in gray header row (e.g. 'columns (fullsize)').
                  Variants go in parens and become CSS modifier classes.
    rows        — list of rows. Each row is a list of cells. Each cell is a
                  list of content_blocks (see write_cell). A row with a single
                  cell is rendered full-width (merged across all columns).
    col_widths  — optional list of column widths in inches.
    """
    ncols = max((len(r) for r in rows), default=1)
    ncols = max(ncols, 1)

    table = doc.add_table(rows=1 + len(rows), cols=ncols)
    table.autofit = False
    set_table_borders(table)

    hcell = merge_row_cells(table, 0)
    set_cell_shading(hcell, HEADER_FILL)
    hcell.text = ""
    hp = hcell.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hr = hp.add_run(name)
    hr.bold = True
    hr.font.size = Pt(11)

    for ri, row in enumerate(rows, start=1):
        if len(row) == 1 and ncols > 1:
            c = merge_row_cells(table, ri)
            write_cell(c, row[0])
        else:
            for ci, cell_blocks in enumerate(row):
                write_cell(table.rows[ri].cells[ci], cell_blocks)

    if col_widths and len(col_widths) == ncols:
        for ri in range(len(table.rows)):
            for ci, w in enumerate(col_widths):
                try:
                    table.rows[ri].cells[ci].width = Inches(w)
                except Exception:
                    pass

    doc.add_paragraph()
    return table


def add_section_break(doc):
    """Visual marker between Milo sections. Renders as centered gray text."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("— SECTION BREAK —")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(0xA0, 0xA0, 0xA0)
    run.bold = True


# ----- re-exports ----------------------------------------------------------
# Consumers typically only need Document + add_block + add_section_break +
# add_runs. Everything else is exposed for advanced use.

__all__ = [
    'Document',
    'Pt', 'Cm', 'Inches', 'RGBColor',
    'HEADER_FILL', 'BORDER_COLOR', 'LINK_COLOR',
    'set_cell_shading', 'set_cell_borders', 'set_table_borders',
    'merge_row_cells',
    'add_hyperlink', 'add_runs',
    'write_cell',
    'add_block', 'add_section_break',
]

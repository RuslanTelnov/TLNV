from bs4 import BeautifulSoup
import sys

def analyze():
    with open("wb_debug.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Find Title
    # It contained "Туалетная вода Paco Rabanne Invictus"
    title_el = soup.find(string=lambda t: "Paco Rabanne" in t if t else False)
    if title_el:
        parent = title_el.parent
        print(f"TITLE FOUND: Tag={parent.name} Class={parent.get('class')}")
        print(f"Full Text: {parent.get_text().strip()}")
    else:
        print("Title NOT FOUND in HTML via BS4")

    # 2. Find Attributes
    # Look for "Группа аромата"
    attr_el = soup.find(string=lambda t: "Группа аромата" in t if t else False)
    if attr_el:
        parent = attr_el.parent
        print(f"\nATTR LABEL FOUND: Tag={parent.name} Class={parent.get('class')}")
        # Try to find value (sibling or parent sibling)
        print(f"Parent Parent HTML: {parent.parent.prettify()[:500]}")
    else:
        print("Attribute 'Группа аромата' NOT FOUND")

    # 3. Find Description
    # Look for "Состав" or known text "парфюмерная композиция" or "Описание"
    desc_el = soup.find(string=lambda t: "Описание" in t if t else False)
    if desc_el:
         parent = desc_el.parent
         print(f"\nDESCRIPTION LABEL FOUND: Tag={parent.name} Class={parent.get('class')}")
    
    # Try to find specific description text from debug.txt
    real_desc = soup.find(string=lambda t: "водный-древесный" in t if t else False)
    if real_desc:
         print(f"Real Desc Text Found in: {real_desc.parent.name} class={real_desc.parent.get('class')}")
        
    # Check for table structure
    tables = soup.find_all("table")
    print(f"\nTotal Tables found: {len(tables)}")
    for i, t in enumerate(tables):
        print(f"Table {i} Classes: {t.get('class')}")
        # Check rows
        rows = t.find_all("tr")
        print(f"Rows found: {len(rows)}")
        if rows:
             print(f"First Row HTML: {rows[0].prettify()[:500]}")
             # Check cells
             cells = rows[0].find_all(["th", "td"])
             print(f"Cells in first row: {len(cells)}")
             for c in cells:
                 print(f"Cell Tag: {c.name}, Text: {c.get_text().strip()}")

if __name__ == "__main__":
    analyze()

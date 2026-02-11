import svgwrite
from svgwrite import cm, mm, rgb

def create_design(filename):
    # A4 Dimensions
    A4_W_mm = 210
    A4_H_mm = 297
    
    # Box Dimensions (Adjusted to fit A4 width 210mm)
    # Width = 210. 
    # Layout: Glue(12) + Side(18) + Front(55) + Side(18) + Back(55) = 158mm. Fits easily.
    # Height: 160mm + Header(30) + Flaps(15). Total ~205mm. Fits easily.
    
    W = 55   # Width of Front/Back
    D = 18   # Depth of Sides
    H = 160  # Height of Box
    Header_H = 30 
    Glue_Tab = 12
    Flap_H = 15
    Tuck_H = 15
    
    # Colors
    # First left box is likely the Dark/Black one.
    COLOR_BG = "#1e272e" # Dark Blue/Grey (Black Pearl)
    COLOR_ACCENT = "#3498db" # Blue accent? Or maybe just monochrome. Let's keep it minimal.
    # Actually, the first box often has a specific color. Let's assume it's the Dark one.
    # The user said "using the first left box".
    # I will make it full dark background.
    
    # Canvas setup (A4)
    dwg = svgwrite.Drawing(filename, profile='full', size=('210mm', '297mm'))
    
    # Background (White paper)
    dwg.add(dwg.rect(insert=(0, 0), size=('100%', '100%'), fill='white'))
    
    # Styles
    cut_line = {'stroke': 'black', 'stroke_width': 0.5, 'fill': 'none'}
    fold_line = {'stroke': 'red', 'stroke_width': 0.5, 'stroke_dasharray': '3,3', 'fill': 'none'}
    
    # Positioning to center on A4
    total_w = Glue_Tab + D + W + D + W
    start_x = (A4_W_mm - total_w) / 2
    start_y = (A4_H_mm - (H + Header_H + Flap_H*2)) / 2 + 20 # Shift down a bit
    
    # --- LAYOUT ---
    
    # 1. Glue Tab
    dwg.add(dwg.path(d=f"M {start_x} {start_y} L {start_x+Glue_Tab} {start_y} L {start_x+Glue_Tab} {start_y+H} L {start_x} {start_y+H} Z", **cut_line))
    dwg.add(dwg.line(start=(start_x+Glue_Tab, start_y), end=(start_x+Glue_Tab, start_y+H), **fold_line))
    
    current_x = start_x + Glue_Tab
    
    # 2. Side Panel 1 (Left)
    # Background
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(D, H), fill=COLOR_BG, stroke='none'))
    
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(D, H), **cut_line))
    dwg.add(dwg.line(start=(current_x+D, start_y), end=(current_x+D, start_y+H), **fold_line))
    
    # Flaps Side 1
    # Bottom
    dwg.add(dwg.path(d=f"M {current_x} {start_y+H} L {current_x} {start_y+H+Flap_H} L {current_x+D} {start_y+H+Flap_H} L {current_x+D} {start_y+H}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y+H), end=(current_x+D, start_y+H), **fold_line))
    # Top
    dwg.add(dwg.path(d=f"M {current_x} {start_y} L {current_x} {start_y-Flap_H} L {current_x+D} {start_y-Flap_H} L {current_x+D} {start_y}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y), end=(current_x+D, start_y), **fold_line))

    current_x += D
    
    # 3. Front Panel
    # Background
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(W, H), fill=COLOR_BG, stroke='none'))
    
    # Front Design Content
    # Logo
    dwg.add(dwg.text("NEWEST", insert=(current_x + W/2, start_y + 20), fill='white', font_size=10, font_family="Arial", font_weight="bold", text_anchor="middle"))
    dwg.add(dwg.text("SMART HOME", insert=(current_x + W/2, start_y + 24), fill='white', font_size=4, font_family="Arial", text_anchor="middle"))
    
    # Title
    dwg.add(dwg.text("ЧЕХОЛ", insert=(current_x + W/2, start_y + 40), fill='white', font_size=14, font_family="Arial", font_weight="bold", text_anchor="middle"))
    dwg.add(dwg.text("ДЛЯ ПУЛЬТА", insert=(current_x + W/2, start_y + 48), fill='white', font_size=8, font_family="Arial", text_anchor="middle"))
    
    # Remote Placeholder (Rounded Rect) - Darker placeholder for dark theme
    dwg.add(dwg.rect(insert=(current_x + 15, start_y + 60), size=(25, 80), rx=3, ry=3, fill="#2c3e50", stroke="#34495e", stroke_width=0.5))
    # Remote buttons
    dwg.add(dwg.circle(center=(current_x + 27.5, start_y + 70), r=5, fill="#34495e"))
    dwg.add(dwg.circle(center=(current_x + 27.5, start_y + 85), r=3, fill="#34495e"))
    dwg.add(dwg.circle(center=(current_x + 27.5, start_y + 95), r=3, fill="#34495e"))
    
    # Bottom Text
    dwg.add(dwg.text("ЗАЩИТНЫЙ", insert=(current_x + W/2, start_y + H - 25), fill='white', font_size=6, font_family="Arial", font_weight="bold", text_anchor="middle"))
    dwg.add(dwg.text("СИЛИКОНОВЫЙ", insert=(current_x + W/2, start_y + H - 18), fill='white', font_size=6, font_family="Arial", font_weight="bold", text_anchor="middle"))
    
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(W, H), **cut_line))
    dwg.add(dwg.line(start=(current_x+W, start_y), end=(current_x+W, start_y+H), **fold_line))
    
    # Bottom Tuck Flap (Front)
    dwg.add(dwg.path(d=f"M {current_x} {start_y+H} L {current_x} {start_y+H+D} L {current_x+W} {start_y+H+D} L {current_x+W} {start_y+H}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y+H), end=(current_x+W, start_y+H), **fold_line))
    dwg.add(dwg.path(d=f"M {current_x} {start_y+H+D} L {current_x+5} {start_y+H+D+Tuck_H} L {current_x+W-5} {start_y+H+D+Tuck_H} L {current_x+W} {start_y+H+D}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y+H+D), end=(current_x+W, start_y+H+D), **fold_line))

    current_x += W
    
    # 4. Side Panel 2 (Right)
    # Background
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(D, H), fill=COLOR_BG, stroke='none'))
    
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(D, H), **cut_line))
    dwg.add(dwg.line(start=(current_x+D, start_y), end=(current_x+D, start_y+H), **fold_line))
    
    # Flaps Side 2
    # Bottom
    dwg.add(dwg.path(d=f"M {current_x} {start_y+H} L {current_x} {start_y+H+Flap_H} L {current_x+D} {start_y+H+Flap_H} L {current_x+D} {start_y+H}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y+H), end=(current_x+D, start_y+H), **fold_line))
    # Top
    dwg.add(dwg.path(d=f"M {current_x} {start_y} L {current_x} {start_y-Flap_H} L {current_x+D} {start_y-Flap_H} L {current_x+D} {start_y}", **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y), end=(current_x+D, start_y), **fold_line))

    current_x += D
    
    # 5. Back Panel
    # Background
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(W, H), fill=COLOR_BG, stroke='none'))
    
    dwg.add(dwg.rect(insert=(current_x, start_y), size=(W, H), **cut_line))
    
    # Header (Top of Back Panel)
    # Front face of header
    dwg.add(dwg.rect(insert=(current_x, start_y - Header_H), size=(W, Header_H), fill=COLOR_BG, stroke='none'))
    dwg.add(dwg.rect(insert=(current_x, start_y - Header_H), size=(W, Header_H), **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y), end=(current_x+W, start_y), **fold_line))
    
    # Back face of header
    dwg.add(dwg.rect(insert=(current_x, start_y - Header_H*2), size=(W, Header_H), fill=COLOR_BG, stroke='none'))
    dwg.add(dwg.rect(insert=(current_x, start_y - Header_H*2), size=(W, Header_H), **cut_line))
    dwg.add(dwg.line(start=(current_x, start_y - Header_H), end=(current_x+W, start_y - Header_H), **fold_line))
    
    # Euro Slot
    slot_w = 25
    slot_h = 8
    slot_x = current_x + (W - slot_w) / 2
    slot_y = start_y - Header_H + (Header_H - slot_h) / 2
    
    slot_path = dwg.path(**cut_line)
    slot_path.push(f"M {slot_x} {slot_y + slot_h/2}")
    slot_path.push(f"A {slot_h/2} {slot_h/2} 0 0 1 {slot_x + slot_h} {slot_y}")
    slot_path.push(f"L {slot_x + slot_w - slot_h} {slot_y}")
    slot_path.push(f"A {slot_h/2} {slot_h/2} 0 0 1 {slot_x + slot_w} {slot_y + slot_h/2}")
    slot_path.push(f"A {slot_h/2} {slot_h/2} 0 0 1 {slot_x + slot_w - slot_h} {slot_y + slot_h}")
    slot_path.push(f"L {slot_x + slot_h} {slot_y + slot_h}")
    slot_path.push(f"A {slot_h/2} {slot_h/2} 0 0 1 {slot_x} {slot_y + slot_h/2}")
    dwg.add(slot_path)
    
    # Top Tuck Flap (Attached to Front Panel)
    front_x = start_x + Glue_Tab + D
    dwg.add(dwg.path(d=f"M {front_x} {start_y} L {front_x} {start_y-D} L {front_x+W} {start_y-D} L {front_x+W} {start_y}", **cut_line))
    dwg.add(dwg.line(start=(front_x, start_y), end=(front_x+W, start_y), **fold_line))
    dwg.add(dwg.path(d=f"M {front_x} {start_y-D} L {front_x+5} {start_y-D-Tuck_H} L {front_x+W-5} {start_y-D-Tuck_H} L {front_x+W} {start_y-D}", **cut_line))
    dwg.add(dwg.line(start=(front_x, start_y-D), end=(front_x+W, start_y-D), **fold_line))

    dwg.save()
    print(f"Design saved to {filename}")

if __name__ == "__main__":
    create_design("box_design_a4.svg")

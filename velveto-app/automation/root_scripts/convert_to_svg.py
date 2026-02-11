from PIL import Image, ImageFilter, ImageOps
import numpy as np
import sys

def image_to_svg(image_path, output_path):
    print(f"Processing {image_path}...")
    
    try:
        # Read image
        img = Image.open(image_path).convert("L") # Convert to grayscale
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Debug stats
    print(f"Original image range: {img.getextrema()}")

    # Enhance contrast
    img = ImageOps.autocontrast(img, cutoff=2)
    print(f"Contrast enhanced range: {img.getextrema()}")

    # Blur to reduce noise
    img_blurred = img.filter(ImageFilter.GaussianBlur(1)) # Reduced blur radius
    
    # Find edges
    edges = img_blurred.filter(ImageFilter.FIND_EDGES)
    
    # Threshold edges
    edges_data = np.array(edges)
    print(f"Edges data range: {edges_data.min()} - {edges_data.max()}")
    
    # Lower threshold significantly. Edges might be faint.
    threshold = 20 
    binary_edges = edges_data > threshold
    
    edge_pixel_count = np.sum(binary_edges)
    print(f"Found {edge_pixel_count} edge pixels")

    if edge_pixel_count == 0:
        print("Warning: No edges found!")
    
    height, width = binary_edges.shape
    
    print("Vectorizing edges...")
    
    with open(output_path, "w") as f:
        # Write SVG Header
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n')
        f.write(f'<g stroke="black" stroke-width="1">\n')
        
        # Simple horizontal run-length encoding style vectorization
        for y in range(height):
            start_x = -1
            for x in range(width):
                if binary_edges[y, x]:
                    if start_x == -1:
                        start_x = x
                else:
                    if start_x != -1:
                        # End of a segment
                        f.write(f'<line x1="{start_x}" y1="{y}" x2="{x}" y2="{y}" />\n')
                        start_x = -1
            if start_x != -1:
                 f.write(f'<line x1="{start_x}" y1="{y}" x2="{width}" y2="{y}" />\n')
        
        f.write('</g>\n')
        f.write('</svg>\n')

    print(f"Saved SVG to {output_path}")

if __name__ == "__main__":
    input_img = "/home/wik/.gemini/antigravity/brain/629bb43c-94ff-45cf-91fb-b361d27ccc42/generated_remote_case_3d_1768197804447.png"
    output_svg = "/home/wik/.gemini/antigravity/brain/629bb43c-94ff-45cf-91fb-b361d27ccc42/generated_case_3d.svg"
    image_to_svg(input_img, output_svg)

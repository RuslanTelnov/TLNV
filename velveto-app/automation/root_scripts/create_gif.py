from PIL import Image
import os

image_folder = '/home/wik/.gemini/antigravity/scratch/wb-dashboard-project/images'
image_names = [
    'pink_capsules_clean.png',
    'pink_capsules_creative.png',
    'pink_capsules_floating.png',
    'pink_capsules_marble.png'
]

images = []
for name in image_names:
    path = os.path.join(image_folder, name)
    if os.path.exists(path):
        img = Image.open(path)
        # Resize to common size if needed, but they should be similar. 
        # Let's resize to the size of the first image to be safe.
        if images:
            img = img.resize(images[0].size, Image.Resampling.LANCZOS)
        images.append(img)

if images:
    output_path = os.path.join(image_folder, 'pink_capsules_showcase.gif')
    # Duration is in milliseconds per frame
    images[0].save(
        output_path, 
        save_all=True, 
        append_images=images[1:], 
        optimize=True, 
        duration=800, 
        loop=0
    )
    print(f"GIF saved to {output_path}")
else:
    print("No images found")

"""Generate PWA icons from SVG using PIL."""
from PIL import Image, ImageDraw
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(script_dir, "..", "public")
svg_path = os.path.join(public_dir, "favicon.svg")

# Since PIL can't read SVG, create icons programmatically based on favicon design
def make_icon(size):
    img = Image.new("RGBA", (size, size), (15, 27, 61, 255))  # #0f1b3d
    draw = ImageDraw.Draw(img)
    
    # Gold circle in center
    cx, cy = size // 2, size // 2
    r = size * 0.28
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(201, 168, 76, 255))  # #c9a84c
    
    # Scale bar
    bar_y = int(size * 0.38)
    bar_x1 = int(size * 0.2)
    bar_x2 = int(size * 0.8)
    draw.line([(bar_x1, bar_y), (bar_x2, bar_y)], fill=(201, 168, 76, 255), width=max(1, size // 20))
    
    # Scale pans
    pan_w = int(size * 0.15)
    pan_h = int(size * 0.08)
    # Left pan
    draw.polygon([
        (bar_x1 - pan_w // 2, bar_y),
        (bar_x1 - pan_w, bar_y + pan_h),
        (bar_x1, bar_y + pan_h),
    ], fill=(201, 168, 76, 255))
    # Right pan
    draw.polygon([
        (bar_x2 + pan_w // 2, bar_y),
        (bar_x2 + pan_w, bar_y + pan_h),
        (bar_x2, bar_y + pan_h),
    ], fill=(201, 168, 76, 255))
    
    # Vertical pole
    draw.line([(cx, bar_y), (cx, int(size * 0.62))], fill=(201, 168, 76, 255), width=max(1, size // 25))
    
    return img

for s in [192, 512]:
    icon = make_icon(s)
    out_path = os.path.join(public_dir, f"pwa-{s}.png")
    icon.save(out_path, "PNG")
    print(f"Generated {out_path} ({s}x{s})")

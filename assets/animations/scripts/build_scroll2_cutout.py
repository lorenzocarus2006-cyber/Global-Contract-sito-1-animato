import sys, os, glob
from PIL import Image, ImageFilter
import numpy as np

SRC_DIR = "/Users/lorenzorubino/SITO GLOBAL DEFINITIVO/DEFINITIVO/assets/animations/scroll-2/frame non ritagliati"
OUT_DIR = "/Users/lorenzorubino/SITO GLOBAL DEFINITIVO/DEFINITIVO/assets/animations/scroll-2/frame ritagliati"

def process_frame(f_in, f_out, preview_black=False):
    im = Image.open(f_in).convert("RGB")
    rgb = np.asarray(im)
    h, w, _ = rgb.shape
    rgb_f = rgb.astype(np.float32)

    # 1. Campionamento del colore di sfondo (verde) dai bordi
    corners = np.stack([
        rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1], 
        rgb[h // 2, 0], rgb[h // 2, -1], rgb[0, w // 2], rgb[-1, w // 2]
    ])
    bg = np.median(corners, axis=0)

    # 2. Calcolo della differenza dal colore di sfondo
    diff = np.linalg.norm(rgb_f - bg, axis=2)
    
    # 3. Identificazione dello sfondo
    # Il verde chroma key di solito è molto uniforme.
    is_bg = (diff < 60)
    
    # Aggiungiamo anche un controllo esplicito sul verde per sicurezza
    R, G, B = rgb_f[:,:,0], rgb_f[:,:,1], rgb_f[:,:,2]
    green_score = G - np.maximum(R, B)
    is_green = (G > 80) & (green_score > 15)
    
    is_bg = is_bg | is_green

    # 4. Creazione della maschera (Alpha)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)

    # Ammorbidimento dei bordi e chiusura buchi
    a_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(radius=1.0))
    a_np = np.asarray(a_img).copy()
    a_np[a_np < 40] = 0
    a_np[a_np > 200] = 255

    # 5. Despill (rimozione del "verdino del cazzo" sui bordi)
    rgb_despill = rgb.copy()
    max_rb = np.maximum(R, B)
    needs_despill = (G > max_rb) & (a_np > 0)
    
    # Riduciamo il verde al massimo tra rosso e blu
    rgb_despill[needs_despill, 1] = max_rb[needs_despill]

    if preview_black:
        # Mettiamo su sfondo nero per vedere bene i bordi
        black_bg = np.zeros_like(rgb)
        alpha_float = a_np.astype(np.float32) / 255.0
        alpha_float = np.expand_dims(alpha_float, axis=2)
        final_rgb = (rgb_despill.astype(np.float32) * alpha_float + black_bg * (1 - alpha_float)).astype(np.uint8)
        out = Image.fromarray(final_rgb)
    else:
        # Salviamo come PNG trasparente
        rgba = np.dstack([rgb_despill.astype(np.uint8), a_np])
        out = Image.fromarray(rgba, mode="RGBA")
        
    out.save(f_out)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    
    files = sorted(glob.glob(os.path.join(SRC_DIR, "*.jpg")))
    
    if mode == "preview":
        preview_dir = "/Users/lorenzorubino/SITO GLOBAL DEFINITIVO/DEFINITIVO/assets/animations/scroll-2/preview_black"
        os.makedirs(preview_dir, exist_ok=True)
        # Selezioniamo alcuni frame chiave
        indices = [0, 30, 60, 90, len(files)-1]
        for idx in indices:
            f_in = files[idx]
            name = os.path.basename(f_in).replace(".jpg", ".png")
            f_out = os.path.join(preview_dir, name)
            process_frame(f_in, f_out, preview_black=True)
            print(f"Preview generata: {f_out}")
    elif mode == "all":
        os.makedirs(OUT_DIR, exist_ok=True)
        for idx, f_in in enumerate(files):
            name = os.path.basename(f_in).replace(".jpg", ".png")
            f_out = os.path.join(OUT_DIR, name)
            process_frame(f_in, f_out, preview_black=False)
            if idx % 10 == 0:
                print(f"Elaborato frame {idx}/{len(files)}")
        print("Tutti i frame ritagliati completati.")

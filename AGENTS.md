# Project architecture decisions

- Mirra Studio Noir "warm editorial" is the sole visual system: dark chocolate surfaces, cream actions and text, warm taupe accents, DM Serif Display + Fira Sans, and floating pill dock navigation.
- The app ships dark-first without requiring a `.dark` class; the chocolate-and-cream palette is the default theme.
- Hairstyle previews use the current Lovable image-edit endpoint and save generated PNGs to the authenticated user's storage path, because generated base64 output must become a durable app URL.
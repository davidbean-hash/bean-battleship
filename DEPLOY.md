# Deployment Guide

## Quick Deploy (Netlify - Recommended)

1. **Build the project:**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with the static site.

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `dist/` folder
   - Done! You'll get a URL like `https://bean-battleship-xyz.netlify.app`

3. **Optional: Custom domain**
   - In Netlify dashboard → Domain settings
   - Add custom domain (e.g., `beanbattleship.com`)

## Alternative: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Follow prompts** to link to your Vercel account

## Alternative: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "homepage": "https://YOUR_USERNAME.github.io/bean-battleship"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: `gh-pages` branch
   - Save

## Troubleshooting

### Build fails
- Make sure `npm install` ran successfully
- Check Node version: `node -v` (should be 18+)
- Try `rm -rf node_modules package-lock.json && npm install`

### Blank page after deploy
- Check browser console for errors
- Make sure `public/hero.jpg` exists
- Verify `dist/index.html` was created

### Images not loading
- Vite uses `/` as base URL by default
- If deploying to a subdirectory, update `vite.config.ts`:
  ```ts
  export default defineConfig({
    base: '/bean-battleship/', // if deploying to github.io/bean-battleship
  })
  ```

## Environment Variables

This project has **no environment variables** — it's 100% client-side.

## Performance

- Gzipped bundle: ~54 KB JS + ~6 KB CSS
- First paint: < 1s on fast connection
- No external API calls
- All assets are local

## Post-Deploy Checklist

- [ ] Game loads without errors
- [ ] Can place all 5 ships
- [ ] Can start battle
- [ ] AI makes moves
- [ ] Game over modal appears when fleet is sunk
- [ ] "Play Again" works
- [ ] Responsive on mobile
- [ ] Fenway Park photo loads

Done! 🎯

# B & O Upholstery website

The homepage for B & O Upholstery, built from the design handoff
(`BO Homepage v2`). It is a plain static site: no build step, no frameworks.

## Files

| File | What it is |
|---|---|
| `index.html` | The page content (all the text, images and links) |
| `styles.css` | Colours, fonts, sizes and the mobile layout |
| `script.js` | Mobile menu, photo upload and the quote form |
| `images/` | Photos, converted to WebP in two sizes (`-800` and `-1600`) |

## See it on your computer

Double-click `index.html` to open it in a browser. Or, from this folder, run:

```
npx serve .
```

and open the address it prints.

## Connect the quote form

Right now the form checks what people typed, but it is not connected to an
inbox yet. Until it is, pressing **Send request** shows a message asking
people to call or email.

To connect it:

1. Make a form on a form service that accepts file uploads, for example
   [Formspree](https://formspree.io) (photo uploads need a paid plan) and set it
   to email `boupholstery@hotmail.com`.
2. Copy the form's address (it looks like `https://formspree.io/f/abcdwxyz`).
3. In `script.js`, near the top, paste it in:
   ```js
   const FORM_ENDPOINT = "https://formspree.io/f/abcdwxyz";
   ```

The form sends `first_name`, `last_name`, `email`, `phone`, `comments` and up
to 10 `photos`. Large photos are shrunk in the browser before sending.

## Still to do (from the design handoff)

Search the code for `TODO` to find these:

- Real Google reviews and names (reviews 2 and 3 and all names are placeholders).
- The Google reviews link.
- Instagram and Facebook links in the footer.
- Pages for Services, Gallery, Fabric Suppliers and About. Until they exist,
  the nav links jump to the matching section on this page.
- If the business has a Google Business listing, swap the map for its official
  "Share → Embed a map" code.

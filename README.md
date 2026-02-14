# Valentine's Day Interactive Website ❤️

A complete, interactive Valentine's Day website built with HTML, CSS, and Vanilla JavaScript.

## Project Structure

```
valentines_day/
│
├── index.html          # Main HTML entry point
├── styles.css          # All styling and animations
├── script.js           # All JavaScript logic
├── images/             # Image assets directory
│   ├── initial-photo.jpg
│   └── final-gift.jpg
└── README.md           # This file
```

## Setup Instructions

1. **Add Images**: Place your images in the `images/` folder:
   - `initial-photo.jpg` - A romantic image for the initial display
   - `final-gift.jpg` - The gift image that appears after confirmation

2. **Open the Website**: Simply open `index.html` in your web browser.

## Features

### ✨ Interactive Elements

- **Yes Button**: Progressive confirmation with 5 stages
  - Each click increases button size
  - Text changes through confirmation messages
  - Smooth scaling animations

- **No Button**: Playful escape behavior
  - Moves to random position when hovered
  - Smooth transitions
  - Stays within viewport boundaries
  - Gets smaller with each Yes button stage

### 🎨 Design Features

- Romantic gradient background
- Smooth CSS animations and transitions
- Responsive design (works on desktop and mobile)
- Glowing text effects
- Pulsing image animation

### 📱 Responsive

- Optimized for desktop, tablet, and mobile devices
- Touch-friendly button interactions
- Adaptive font sizes and spacing

## How It Works

1. **Initial State**: Displays romantic image and "Will you be my Valentine?" text
2. **No Button**: Moves randomly when hovered/touched
3. **Yes Button**: Requires 5 clicks with progressive confirmation
4. **Final Reveal**: After 5th click, shows gift image and celebration message

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Customization

You can easily customize:
- Colors in `styles.css` (gradient backgrounds, button colors)
- Confirmation messages in `script.js` (`confirmationMessages` array)
- Animation timings in `styles.css` (transition durations)
- Image paths in `index.html` and `script.js`

Enjoy your Valentine's Day website! ❤️

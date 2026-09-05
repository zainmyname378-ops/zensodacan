import CircularGallery from './CircularGallery'

<div style={{ height: '600px', position: 'relative' }}>
  <CircularGallery
    bend={3}
    textColor="#ffffff"
    borderRadius={0.05}
    scrollEase={0.02}
    // Optionally load a custom font for the labels.
    // Accepts a stylesheet URL (e.g. Google Fonts) or a direct font file.
    fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
    font="bold 30px Orbitron"
  />
</div>
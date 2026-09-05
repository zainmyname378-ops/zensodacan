import { useEffect, useRef, useState } from "react";
import "./App.css";
import section2Bg from "./assets/section2-bg.jpg";
const FRAME_COUNT = 100;

const SCROLL_SENSITIVITY = 0.00012;
const FRAME_SMOOTHING = 0.12;
const TRANSITION_DURATION = 900;

function App() {
  const canvasRef = useRef(null);

  const imagesRef = useRef([]);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  const currentFrameRef = useRef(-1);
const [selectedFlavor, setSelectedFlavor] = useState("normal");

const flavorVideos = {
  normal: "/videos/normal.mp4",
  mint: "/videos/mint.mp4",
  lemon: "/videos/lemon.mp4",
  blueberry: "/videos/blueberry.mp4",
};
  /*
    Scroll state machine:

    hero
      ↓
    entering-section
      ↓
    section
      ↓
    returning-hero
      ↓
    hero
  */
  const modeRef = useRef("hero");

  const transitionStartRef = useRef(0);
  const transitionFromRef = useRef(0);
  const transitionToRef = useRef(0);

  const animationFrameRef = useRef(null);
  const transitionFrameRef = useRef(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let destroyed = false;

    // =====================================================
    // DRAW FRAME
    // =====================================================

    function drawFrame(frameIndex) {
      const images = imagesRef.current;

      if (!images.length) return;

      const index = Math.max(
        0,
        Math.min(
          FRAME_COUNT - 1,
          Math.round(frameIndex)
        )
      );

      const img = images[index];

      if (
        !img ||
        !img.complete ||
        !img.naturalWidth
      ) {
        return;
      }

      if (currentFrameRef.current === index) {
        return;
      }

      currentFrameRef.current = index;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      const scale = Math.max(
        width / img.naturalWidth,
        height / img.naturalHeight
      );

      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;

      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      ctx.drawImage(
        img,
        x,
        y,
        drawWidth,
        drawHeight
      );
    }

    // =====================================================
    // RESIZE CANVAS
    // =====================================================

    function resizeCanvas() {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.5
      );

      canvas.width =
        window.innerWidth * dpr;

      canvas.height =
        window.innerHeight * dpr;

      canvas.style.width = "100vw";
      canvas.style.height = "100vh";

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      currentFrameRef.current = -1;

      drawFrame(
        currentProgressRef.current *
          (FRAME_COUNT - 1)
      );
    }

    // =====================================================
    // CINEMATIC VIEWPORT TRANSITION
    // =====================================================

    function animateTransition(time) {
      if (destroyed) return;

      const elapsed =
        time - transitionStartRef.current;

      let progress = Math.min(
        elapsed / TRANSITION_DURATION,
        1
      );

      /*
        Cinematic cubic ease-in-out.
      */
      const eased =
        progress < 0.5
          ? 4 *
            progress *
            progress *
            progress
          : 1 -
            Math.pow(
              -2 * progress + 2,
              3
            ) /
              2;

      const position =
        transitionFromRef.current +
        (transitionToRef.current -
          transitionFromRef.current) *
          eased;

      window.scrollTo(0, position);

      if (progress < 1) {
        transitionFrameRef.current =
          requestAnimationFrame(
            animateTransition
          );

        return;
      }

      window.scrollTo(
        0,
        transitionToRef.current
      );

      if (
        modeRef.current ===
        "entering-section"
      ) {
        modeRef.current = "section";
      }

      if (
        modeRef.current ===
        "returning-hero"
      ) {
        modeRef.current = "hero";
      }

      transitionFrameRef.current = null;
    }

    // =====================================================
    // ENTER SECTION 2
    // =====================================================

    function enterSection() {
      if (transitionFrameRef.current) {
        cancelAnimationFrame(
          transitionFrameRef.current
        );
      }

      modeRef.current =
        "entering-section";

      transitionStartRef.current =
        performance.now();

      transitionFromRef.current =
        window.scrollY;

      transitionToRef.current =
        window.innerHeight;

      transitionFrameRef.current =
        requestAnimationFrame(
          animateTransition
        );
    }

    // =====================================================
    // RETURN TO HERO
    // =====================================================

    function returnToHero() {
      if (transitionFrameRef.current) {
        cancelAnimationFrame(
          transitionFrameRef.current
        );
      }

      modeRef.current =
        "returning-hero";

      transitionStartRef.current =
        performance.now();

      transitionFromRef.current =
        window.scrollY;

      transitionToRef.current = 0;

      /*
        Keep the Hero animation at frame 100
        while the viewport travels back.
      */
      targetProgressRef.current = 1;
      currentProgressRef.current = 1;

      currentFrameRef.current = -1;

      drawFrame(FRAME_COUNT - 1);

      transitionFrameRef.current =
        requestAnimationFrame(
          animateTransition
        );
    }

    // =====================================================
    // MOUSE WHEEL
    // =====================================================

    function handleWheel(event) {
      const delta = event.deltaY;

      const goingDown = delta > 0;
      const goingUp = delta < 0;

      // ===================================================
      // HERO
      // ===================================================

      if (modeRef.current === "hero") {
        event.preventDefault();

        let movement =
          delta *
          SCROLL_SENSITIVITY;

        movement = Math.max(
          -0.012,
          Math.min(
            0.012,
            movement
          )
        );

        targetProgressRef.current +=
          movement;

        targetProgressRef.current =
          Math.max(
            0,
            Math.min(
              1,
              targetProgressRef.current
            )
          );

        // Animation has reached the end.
        if (
          targetProgressRef.current >=
            0.9999 &&
          goingDown
        ) {
          targetProgressRef.current = 1;

          enterSection();
        }

        return;
      }

      // ===================================================
      // ENTERING SECTION
      // ===================================================

      if (
        modeRef.current ===
        "entering-section"
      ) {
        event.preventDefault();
        return;
      }

      // ===================================================
      // SECTION 2
      // ===================================================

      if (
        modeRef.current ===
        "section"
      ) {
        if (goingUp) {
          event.preventDefault();

          returnToHero();

          return;
        }

        /*
          Going DOWN is intentionally allowed.
          Later this will naturally enter Section 3.
        */

        return;
      }

      // ===================================================
      // RETURNING HERO
      // ===================================================

      if (
        modeRef.current ===
        "returning-hero"
      ) {
        event.preventDefault();
        return;
      }
    }

    // =====================================================
    // FRAME ANIMATION LOOP
    // =====================================================

    function animateFrames() {
      if (destroyed) return;

      const target =
        targetProgressRef.current;

      const current =
        currentProgressRef.current;

      currentProgressRef.current +=
        (target - current) *
        FRAME_SMOOTHING;

      if (
        Math.abs(
          target -
            currentProgressRef.current
        ) < 0.00005
      ) {
        currentProgressRef.current =
          target;
      }

      const frame =
        currentProgressRef.current *
        (FRAME_COUNT - 1);

      drawFrame(frame);

      animationFrameRef.current =
        requestAnimationFrame(
          animateFrames
        );
    }

    // =====================================================
    // LOAD ALL FRAMES
    // =====================================================

    async function loadImages() {
      const images = [];

      for (
        let i = 1;
        i <= FRAME_COUNT;
        i++
      ) {
        const img = new Image();

        const frameNumber =
          String(i).padStart(3, "0");

        img.src =
          `/frames/frame_${frameNumber}.jpg`;

        images.push(img);
      }

      imagesRef.current = images;

      await Promise.all(
        images.map(
          async (img) => {
            try {
              await img.decode();
            } catch {
              // Browser may already have decoded it.
            }
          }
        )
      );

      if (!destroyed) {
        setLoaded(true);
      }
    }

    // =====================================================
    // START
    // =====================================================

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    resizeCanvas();

    loadImages();

    animationFrameRef.current =
      requestAnimationFrame(
        animateFrames
      );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      destroyed = true;

      window.removeEventListener(
        "wheel",
        handleWheel
      );

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (
        transitionFrameRef.current
      ) {
        cancelAnimationFrame(
          transitionFrameRef.current
        );
      };
    };
  }, []);

  return (
    <main className="page">

      {/* =================================================
          FIXED NAVBAR
      ================================================= */}

      <header className="navbar">

        <div className="navbar-brand">
          ZEN
        </div>

        <nav className="nav-links">
          <a href="#hero">EXPERIENCE</a>
          <a href="#flavors">FLAVORS</a>
          <a href="#story">STORY</a>
          <a href="#shop">SHOP</a>
        </nav>

        <button className="menu-button">
          MENU
          <span className="menu-dots">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>

      </header>


      {/* =================================================
          RIGHT SIDE SECTION INDICATOR
      ================================================= */}

      


      {/* =================================================
          HERO
      ================================================= */}

      <section id="hero" className="hero">

  <canvas ref={canvasRef} />

  {/* ONE overlay only */}
  <div className="hero-overlay" />

  {/* REFRESH YOUR STATE */}
 <div
  className="refresh-position"
  style={{
    position: "absolute",
    left: "8vw",
    top: "52%",
    transform: "translateY(-50%)",
    zIndex: 30,
    pointerEvents: "none",
  }}
>
  <div className="refresh-state">
    <span>REFRESH</span>
    <span>YOUR STATE</span>
  </div>
</div>

 
  <div className="hero-content">

    <div className="hero-section-number">
      <span>01</span>
      <div />
    </div>

   

    <button className="hero-button">
      <span>DISCOVER ZEN</span>

      <span className="button-arrow">
        →
      </span>
    </button>

  </div>

  {/* Scroll indicator */}
  <div className="scroll-indicator">

    <div className="scroll-circle">
      ↓
    </div>

    <span>
      {loaded
        ? "SCROLL TO EXPLORE"
        : "LOADING EXPERIENCE..."}
    </span>

  </div>

</section>


      
{/* =================================================
    SECTION 2 — FLAVOR EXPLORER
================================================= */}

<section
  id="flavors"
  className="section-two"
  style={{
    backgroundImage: `url(${section2Bg})`
  }}
>


  <div className="flavor-section-header">
    <span>02 / FLAVORS</span>
    <h2>CHOOSE<br />YOUR STATE.</h2>
    <p>Select a flavor to explore its world.</p>
  </div>

  <div className="flavor-cards">

    {Object.entries(flavorVideos).map(([flavor, video]) => (
      <button
        key={flavor}
        type="button"
        className={`flavor-card ${
          selectedFlavor === flavor ? "selected" : ""
        }`}
        onClick={() => setSelectedFlavor(flavor)}
      >

        <video
          src={video}
          autoPlay
          muted
          loop
          playsInline
          className="flavor-card-video"
        />

        <div className="flavor-card-overlay" />

        <div className="flavor-card-content">
          <span className="flavor-card-number">
            {flavor === "normal"
              ? "01"
              : flavor === "mint"
              ? "02"
              : flavor === "lemon"
              ? "03"
              : "04"}
          </span>

          <h3>{flavor}</h3>

          <span className="flavor-card-action">
            {selectedFlavor === flavor
              ? "SELECTED"
              : "EXPLORE →"}
          </span>
        </div>

      </button>
    ))}

  </div>

</section>
{/* =================================================
    SECTION 3 — PRODUCT VIDEO
================================================= */}

<section
  id="story"
  className="section-three"
  style={{
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
  }}
>
  {/* Background rotating can video */}
  <video
    className="section-three-video"
    src="/videos/section3.mp4"
    autoPlay
    muted
    loop
    playsInline
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 1,
    }}
  />

  {/* FORCE TEXT ABOVE VIDEO */}
  <div
    style={{
      position: "absolute",
      left: "8vw",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      pointerEvents: "auto",
    }}
  >
    <h2
      style={{
        display: "flex",
        flexDirection: "column",
        margin: 0,
        fontFamily: "var(--display)",
        fontSize: "clamp(52px, 6vw, 100px)",
        fontWeight: 600,
        lineHeight: 0.82,
        letterSpacing: "-0.04em",
        textTransform: "uppercase",
        color: "#C4B5FD",
        position: "relative",
        zIndex: 10000,
      }}
    >
      <span>FIND YOUR</span>

      <span style={{ marginLeft: "40px" }}>
        STATE OF ZEN.
      </span>
    </h2>

    <p
      style={{
        marginTop: "35px",
        marginBottom: 0,
        fontFamily: "var(--display)",
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: 1.7,
        letterSpacing: "0.14em",
        color: "rgba(255, 255, 255, 0.8)",
        textTransform: "uppercase",
      }}
    >
      ONE CAN.
      <br />
      ONE MOMENT.
      <br />
      YOUR PERFECT STATE.
    </p>

   <button className="zen-explore-button">
  <span>EXPLORE ZEN</span>
  <span className="zen-explore-arrow">→</span>
</button>
  </div>
</section>

</main>

);
}
export default App;
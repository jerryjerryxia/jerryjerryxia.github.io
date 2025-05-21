// ensure this runs after the page loads
document.addEventListener('DOMContentLoaded', () => {
  VANTA.GLOBE({
    el: '.hero',           // your target container
    mouseControls: true,   // rotate by dragging
    touchControls: true,   // rotate on touch devices
    gyroControls: false,   // tilt to rotate on mobile devices
    minHeight: 200.00,     // minimum height of the scene
    minWidth: 200.00,      // minimum width of the scene

    // 1) Colors
    backgroundColor: 0x0d0f14,  // hero’s background behind the globe
    color:           0x00e5ff,  // primary sphere color
    color2:          0xff00aa,  // secondary color (for faces)

    // 2) Size & scale
    size:   1.00,           // how large the sphere is relative to the container
    scale:  1.0,            // overall scale factor
    scaleMobile: 1.0,       // separate scale for smaller screens

    // 3) Animation speed & detail
    speed:  1.00,           // how fast the sphere undulates/rotates on its own
    points: 12.00,          // controls mesh resolution (more = finer)
    spacing: 15.00,         // controls how tight the mesh is

    // 4) Rendering tweaks
    showBackground: true,   // whether to draw your backgroundColor
    wireframe: false,       // draws just edges of the mesh
    shininess:  50.00       // how “glossy” the faces appear
  });

  const fadeEls = document.querySelectorAll(".fade-up");
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    { threshold: 0,
      rootMargin: '0px 0px -75px 0px'
    }
  );
  fadeEls.forEach((el) => fadeObserver.observe(el));

});


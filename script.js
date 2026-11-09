// IntoTheLighthouse landing page: keep interactions intentionally simple.

(() => {
  const gallery = document.querySelector(".practitioner-gallery");
  if (!gallery) return;

  const images = [...gallery.querySelectorAll(".gallery-image")];
  const dots = [...gallery.querySelectorAll(".gallery-dot")];
  const previous = gallery.querySelector(".gallery-prev");
  const next = gallery.querySelector(".gallery-next");
  let current = 0;
  let touchStartX = 0;

  const show = (index) => {
    current = (index + images.length) % images.length;
    images.forEach((image, i) => image.classList.toggle("is-active", i === current));
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-pressed", String(i === current));
    });
  };

  previous?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
  gallery.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });
  gallery.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 45) show(current + (distance < 0 ? 1 : -1));
  }, { passive: true });
})();

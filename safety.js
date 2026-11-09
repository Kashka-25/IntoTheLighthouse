// Safety page: open the matching dropdown when someone follows a link to it (contents chips or #emergency links).
(() => {
  const openFromHash = () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.tagName === "DETAILS") {
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
})();

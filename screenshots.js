/*
 * Screenshots: light in the page, sharp when zoomed.
 *
 * Pages show each screenshot from the app's repository at 1440 px
 * (`<name>-<theme>-1x.webp`, near-lossless), which is plenty for the page's column.
 * The repository also publishes every screenshot at 2880 px, losslessly
 * (`<name>-<theme>.webp`). When one is zoomed, this swaps that one in once it has
 * downloaded (or before, when the pointer rests on the screenshot), so the zoomed view
 * is sharp without making every page heavier. If it can't be downloaded, the zoomed
 * view keeps the 1440 px one.
 */
;(() => {
  const SMALL = /-1x\.webp(?=$|[?#])/
  const ZOOMED = '[aria-modal="true"] img'
  const loaded = new Set()
  const loading = new Set()
  const failed = new Set()

  const fullSize = (img) => {
    const small = img.currentSrc || img.src
    return SMALL.test(small) ? small.replace(SMALL, '.webp') : null
  }

  const fetchFull = (full) => {
    if (loaded.has(full) || loading.has(full) || failed.has(full)) return
    loading.add(full)
    const probe = new Image()
    probe.onload = () => {
      loading.delete(full)
      loaded.add(full)
      sharpenZoomed()
    }
    probe.onerror = () => {
      loading.delete(full)
      failed.add(full)
    }
    probe.src = full
  }

  // The zoomed images: in the zoom's dialog, and laid out on screen.
  const sharpenZoomed = () => {
    for (const img of document.querySelectorAll(ZOOMED)) {
      const box = img.getBoundingClientRect()
      if (box.width === 0 || box.right <= 0 || box.left >= window.innerWidth) continue
      const full = fullSize(img)
      if (!full) continue
      if (loaded.has(full)) img.src = full
      else fetchFull(full)
    }
  }

  // The zoom builds its dialog, then animates the image into place: look again while
  // it's open, and stop once it closes.
  let watching = false
  const watch = () => {
    if (watching) return
    watching = true
    const tick = () => {
      if (!document.querySelector(ZOOMED)) {
        watching = false
        return
      }
      sharpenZoomed()
      setTimeout(tick, 100)
    }
    tick()
  }
  new MutationObserver(() => {
    if (document.querySelector(ZOOMED)) watch()
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-modal'],
  })

  // A pointer resting on a screenshot usually means a click is next: start downloading
  // the full-size one, so the zoomed view is sharp as it opens. Passing over it while
  // scrolling doesn't count.
  let resting
  document.addEventListener('pointerover', (event) => {
    const img = event.target
    if (event.pointerType !== 'mouse' || !(img instanceof HTMLImageElement)) return
    if (img.closest('[aria-modal="true"]')) return
    const full = fullSize(img)
    if (!full) return
    clearTimeout(resting)
    resting = setTimeout(() => fetchFull(full), 200)
  })
  document.addEventListener('pointerout', (event) => {
    if (event.target instanceof HTMLImageElement) clearTimeout(resting)
  })
})()

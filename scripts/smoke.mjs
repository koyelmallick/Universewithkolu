/**
 * Real-browser smoke test for "Explore the Universe".
 *
 * The Vitest suite mocks WebGL, so it can never catch a shader that fails to
 * compile or a scene that throws inside `useFrame`. This script drives a real
 * Chrome instance over the DevTools Protocol and checks that:
 *
 *   1. the opening sequence plays on a first visit, can be skipped, and does
 *      not play again on a reload,
 *   2. the page loads with no console errors and no uncaught exceptions,
 *   3. all six sections and their anchor targets exist,
 *   4. the hero actually created a WebGL context with a non-zero drawing buffer,
 *   5. tab interactions switch content,
 *   6. there is no horizontal overflow at 390px, 768px and 1920px,
 *   7. the reduced-motion opening works and lets the visitor in unaided.
 *
 * It uses only Node built-ins plus an already-installed Chrome, so there is
 * nothing extra to install.
 *
 *   node scripts/smoke.mjs                      # against http://localhost:5173
 *   node scripts/smoke.mjs http://localhost:5178
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE_URL = process.argv[2] ?? 'http://localhost:5173'
const DEBUG_PORT = 9333
const CDP_TIMEOUT_MS = 45_000

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

const failures = []
const notes = []

function fail(message) {
  failures.push(message)
}

function note(message) {
  notes.push(message)
}

function findBrowser() {
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
}

async function waitForEndpoint(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`DevTools endpoint ${url} did not become ready`)
}

/** Minimal CDP session: request/response plus a flat event listener. */
class Session {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== undefined) {
        const entry = this.pending.get(message.id)
        if (!entry) return
        this.pending.delete(message.id)
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)))
        else entry.resolve(message.result)
        return
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params)
      }
    })
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(listener)
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} timed out`))
      }, CDP_TIMEOUT_MS)
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? 'evaluation threw')
    }
    return result.result.value
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const browserPath = findBrowser()
  if (!browserPath) {
    console.error('No Chrome or Edge installation found. Skipping browser smoke test.')
    process.exit(0)
  }

  const profileDir = mkdtempSync(join(tmpdir(), 'etu-smoke-'))

  const browser = spawn(
    browserPath,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-gpu-sandbox',
      // Allow software WebGL so shaders are genuinely compiled and executed.
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let session
  let targets
  try {
    targets = await waitForEndpoint(`http://127.0.0.1:${DEBUG_PORT}/json/list`, 30_000)
    const page = targets.find((target) => target.type === 'page')
    if (!page) throw new Error('No page target found')

    const socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', () => reject(new Error('WebSocket failed')), { once: true })
    })

    session = new Session(socket)

    const consoleErrors = []
    const consoleWarnings = []
    const exceptions = []

    session.on('Runtime.consoleAPICalled', ({ type, args }) => {
      const text = args
        .map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '')
        .join(' ')
      if (type === 'error') consoleErrors.push(text)
      if (type === 'warning') consoleWarnings.push(text)
    })
    session.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      exceptions.push(
        exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'unknown exception',
      )
    })
    session.on('Log.entryAdded', ({ entry }) => {
      if (entry.level === 'error') consoleErrors.push(`[${entry.source}] ${entry.text}`)
    })

    await session.send('Runtime.enable')
    await session.send('Log.enable')
    await session.send('Page.enable')
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })

    const loaded = new Promise((resolve) => session.on('Page.loadEventFired', resolve))
    await session.send('Page.navigate', { url: BASE_URL })
    await loaded

    // --- 1. opening sequence ------------------------------------------
    // The profile is fresh, so this is a first visit: it must be playing.
    await sleep(1200)
    const intro = await session.evaluate(`
      (() => {
        const overlay = document.querySelector('[data-testid="intro-overlay"]')
        return {
          present: !!overlay,
          dialog: overlay?.getAttribute('role') === 'dialog',
          skip: !!overlay?.querySelector('[data-intro-dismiss]'),
          scrollLocked: document.body.style.overflow === 'hidden',
          h1: document.querySelector('#top h1')?.textContent?.trim() ?? '',
        }
      })()
    `)

    if (!intro.present) fail('Opening sequence did not play on a first visit')
    if (intro.present && !intro.dialog) fail('Opening sequence is not exposed as a dialog')
    if (intro.present && !intro.skip) fail('Opening sequence has no skip control')
    if (intro.present && !intro.scrollLocked) fail('Opening sequence did not lock page scroll')
    if (!/bigger than we imagine/i.test(intro.h1)) {
      fail(`Hero h1 wrong: ${intro.h1}`)
    }

    // Skip it, and make sure it genuinely lets go of the page.
    if (intro.present) {
      await session.evaluate(`document.querySelector('[data-intro-dismiss]')?.click()`)
      await sleep(900)
      const skipped = await session.evaluate(`
        (() => ({
          present: !!document.querySelector('[data-testid="intro-overlay"]'),
          scrollLocked: document.body.style.overflow === 'hidden',
          replay: [...document.querySelectorAll('#top button')]
            .some((button) => /replay/i.test(button.textContent ?? '')),
        }))()
      `)
      if (skipped.present) fail('Skip intro did not dismiss the opening sequence')
      if (skipped.scrollLocked) fail('Skip intro left the page scroll-locked')
      if (!skipped.replay) fail('No replay control in the hero after the intro')
      note('Opening sequence: played on first visit, skipped cleanly, replay control present')
    }

    // A normal reload must not show it again.
    const reloaded = new Promise((resolve) => session.on('Page.loadEventFired', resolve))
    await session.send('Page.reload')
    await reloaded
    await sleep(2000)
    const afterReload = await session.evaluate(`
      (() => ({
        present: !!document.querySelector('[data-testid="intro-overlay"]'),
        stored: (() => {
          try { return localStorage.getItem('etu:intro-seen-v1') } catch { return null }
        })(),
      }))()
    `)
    if (afterReload.present) fail('Opening sequence played again on a reload')
    if (afterReload.stored !== '1') fail('Opening sequence did not remember that it has played')
    note('Opening sequence: refused to replay on reload')

    // Let React mount and the lazily-mounted canvases initialise.
    await sleep(4000)

    // --- 2. structure -------------------------------------------------
    const structure = await session.evaluate(`
      (() => {
        const ids = ['top','space','earth','science','human','discovery','method']
        return {
          title: document.title,
          heading: document.querySelector('h1')?.textContent?.trim() ?? null,
          missingSections: ids.filter((id) => !document.getElementById(id)),
          navLinks: [...document.querySelectorAll('nav a[href^="#"]')].map((a) => a.getAttribute('href')),
          canvasCount: document.querySelectorAll('canvas').length,
          sectionCount: document.querySelectorAll('section').length,
          cloudTexture: performance.getEntriesByType('resource')
            .some((entry) => entry.name.includes('earth-clouds-2048')),
          provenance: !!document.querySelector('#top details a[href*="blue-marble"]'),
        }
      })()
    `)

    if (!/Explore the Universe/i.test(structure.title)) fail(`Unexpected title: ${structure.title}`)
    if (!/The Universe Is Bigger/i.test(structure.heading ?? '')) {
      fail(`Hero h1 missing or wrong: ${structure.heading}`)
    }
    if (structure.missingSections.length) {
      fail(`Missing section anchors: ${structure.missingSections.join(', ')}`)
    }
    for (const id of ['#space', '#earth', '#science', '#human', '#discovery']) {
      if (!structure.navLinks.includes(id)) fail(`Navbar is missing a link to ${id}`)
    }
    if (!structure.cloudTexture) fail('The hero never requested the NASA cloud texture')
    if (!structure.provenance) fail('The hero does not link the globe textures to their source')
    note(`Canvases on the page: ${structure.canvasCount}`)
    note('Hero: cloud texture loaded and texture provenance linked')

    // --- 3. WebGL actually works -------------------------------------
    // Pick a canvas that is inside a scene region: the first canvas on the page
    // belongs to the 2D starfield, which has no WebGL context by design.
    const webgl = await session.evaluate(`
      (() => {
        const canvases = [...document.querySelectorAll('canvas')]
          .filter((c) => c.closest('[role="img"]'))
        if (canvases.length === 0) return { ok: false, reason: 'no scene canvas mounted' }
        const results = canvases.map((canvas) => {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
          return gl
            ? {
                ok: true,
                version: gl.getParameter(gl.VERSION),
                width: gl.drawingBufferWidth,
                height: gl.drawingBufferHeight,
                renderer: gl.getParameter(gl.RENDERER),
              }
            : { ok: false, reason: 'no WebGL context on scene canvas' }
        })
        return results.find((r) => r.ok) ?? results[0]
      })()
    `)

    if (!webgl.ok) {
      fail(`WebGL unavailable in the browser: ${webgl.reason}`)
    } else if (webgl.width === 0 || webgl.height === 0) {
      fail('WebGL drawing buffer is 0x0 - the canvas has no size')
    } else {
      note(`WebGL ${webgl.version} | ${webgl.width}x${webgl.height} | ${webgl.renderer}`)
    }

    // --- 4. tab interactions -----------------------------------------
    const clickTab = async (name) =>
      session.evaluate(`
        (() => {
          const tab = [...document.querySelectorAll('[role="tab"]')]
            .find((el) => el.textContent.toLowerCase().includes(${JSON.stringify(name.toLowerCase())}))
          if (!tab) return false
          tab.click()
          return true
        })()
      `)

    if (!(await clickTab('Jupiter'))) {
      fail('Could not find the Jupiter tab in Explore Space')
    } else {
      await sleep(900)
      const jupiter = await session.evaluate(
        `document.querySelector('[role="tabpanel"]')?.textContent?.includes('318 Earths') ?? false`,
      )
      if (!jupiter) fail('Clicking the Jupiter tab did not update the panel')
    }

    const switchedToBlackHoles = await session.evaluate(`
      (() => {
        const tabs = [...document.querySelectorAll('#science [role="tab"]')]
        const tab = tabs.find((el) => el.textContent.toLowerCase().includes('black holes'))
        if (!tab) return false
        tab.click()
        return true
      })()
    `)
    if (!switchedToBlackHoles) {
      fail('Could not find the Black holes tab in Understand Science')
    } else {
      await sleep(2500)
      const text = await session.evaluate(
        `document.querySelector('#science [role="tabpanel"]')?.textContent ?? ''`,
      )
      if (!/6\.5 billion Suns/.test(text)) fail('Black hole panel content did not render')
      if (!/simulation/i.test(text)) fail('Black hole scene is not labelled as a simulation')
      const brokenImages = await session.evaluate(`
        [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length
      `)
      if (brokenImages > 0) fail(`${brokenImages} image(s) failed to load`)
    }

    // --- 5. responsive overflow --------------------------------------
    for (const width of [390, 768, 1920]) {
      await session.send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 768,
      })
      await sleep(700)
      const overflow = await session.evaluate(
        `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
      )
      if (overflow > 2) fail(`Horizontal overflow of ${overflow}px at ${width}px wide`)
    }

    // --- 6. reduced motion -------------------------------------------
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(1200)
    const stillRendering = await session.evaluate(
      `!!document.querySelector('canvas') && document.querySelectorAll('section').length >= 6`,
    )
    if (!stillRendering) fail('Page broke under prefers-reduced-motion')

    // --- 7. reduced-motion opening -----------------------------------
    // The sequence still runs, as a still, with no camera move to sit through.
    await session.evaluate(`localStorage.removeItem('etu:intro-seen-v1')`)
    const stillReloaded = new Promise((resolve) => session.on('Page.loadEventFired', resolve))
    await session.send('Page.reload')
    await stillReloaded
    await sleep(2000)

    const stillIntro = await session.evaluate(`
      (() => {
        const overlay = document.querySelector('[data-testid="intro-overlay"]')
        return {
          present: !!overlay,
          dismiss: !!overlay?.querySelector('[data-intro-dismiss]'),
          labelled: /simulations/i.test(overlay?.textContent ?? ''),
        }
      })()
    `)
    if (!stillIntro.present) fail('Reduced-motion opening did not render')
    if (stillIntro.present && !stillIntro.dismiss) {
      fail('Reduced-motion opening has no way into the site')
    }
    if (stillIntro.present && !stillIntro.labelled) {
      fail('Reduced-motion opening does not label its simulations')
    }

    // It must let the visitor in without any interaction.
    await sleep(6500)
    const stillGone = await session.evaluate(
      `!document.querySelector('[data-testid="intro-overlay"]')`,
    )
    if (!stillGone) fail('Reduced-motion opening did not auto-enter the site')
    note('Reduced motion: still opening rendered and auto-dismissed')

    await session.send('Emulation.setEmulatedMedia', { features: [] })

    // --- 8. console audit --------------------------------------------
    const ignorable = /favicon|DevTools|Autofill|React DevTools|Download the React/i
    const realErrors = consoleErrors.filter((line) => !ignorable.test(line))
    if (realErrors.length) {
      fail(`Console errors:\n   - ${realErrors.slice(0, 8).join('\n   - ')}`)
    }
    if (exceptions.length) {
      fail(`Uncaught exceptions:\n   - ${exceptions.slice(0, 5).join('\n   - ')}`)
    }

    const noisyWarnings = consoleWarnings.filter(
      (line) => !ignorable.test(line) && /three|shader|webgl|deprecat/i.test(line),
    )
    if (noisyWarnings.length) {
      note(`Warnings worth reading:\n   - ${noisyWarnings.slice(0, 6).join('\n   - ')}`)
    }
  } finally {
    try {
      session?.socket?.close()
    } catch {
      /* already closed */
    }
    browser.kill()
  }

  console.log('\n=== Explore the Universe - browser smoke test ===')
  console.log(`Target: ${BASE_URL}\n`)

  for (const message of notes) console.log(`  i  ${message}`)

  if (failures.length === 0) {
    console.log('\n  PASS  All browser checks passed.\n')
    process.exit(0)
  }

  console.log('')
  for (const message of failures) console.log(`  FAIL  ${message}`)
  console.log(`\n  ${failures.length} check(s) failed.\n`)
  process.exit(1)
}

main().catch((error) => {
  console.error('\nSmoke test could not run:', error.message)
  console.error('Make sure the dev server is running, e.g. npm run dev\n')
  process.exit(2)
})

/**
 * Visual check for the opening sequence.
 *
 * The smoke test proves the page works; it cannot tell you whether the result
 * looks good. This script drives a real Chrome over the DevTools Protocol,
 * captures a PNG of each stage of the opening, and writes them to a folder so
 * they can be looked at.
 *
 * It also prints the browser's own view of the overlay at each step, which is
 * the fastest way to debug "the skip button did nothing".
 *
 *   node scripts/intro-shots.mjs                       # against localhost:5173
 *   node scripts/intro-shots.mjs http://localhost:5178
 *   node scripts/intro-shots.mjs http://localhost:5178 3   # stage 3 only
 *
 * Uses only Node built-ins and an installed Chrome or Edge.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE_URL = process.argv[2] ?? 'http://localhost:5173'
const ONLY_STAGE = process.argv[3] ? Number(process.argv[3]) : null
/**
 * A port of our own, derived from the process id. A fixed port is a trap: if an
 * earlier run left a browser behind, the next run silently attaches to *that*
 * page instead of launching a fresh one, and every check then measures the wrong
 * document.
 */
const DEBUG_PORT = 9300 + (process.pid % 500)

/**
 * Small on purpose: a software rasteriser spends seconds on every full frame, and
 * that delay is what makes a shot land later than its target. Fewer pixels, less
 * drift.
 */
const VIEW = { width: 800, height: 450 }

const OUTPUT_DIR = join(tmpdir(), 'etu-intro-shots')

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

/**
 * Progress marks to shoot at, as a fraction of the whole sequence.
 *
 * Read from the progress bar the sequence itself writes, not from wall-clock
 * time: under a software rasteriser the render loop runs slower than real time,
 * so a time-based script photographs the wrong moment.
 *
 * Aimed roughly half a stage early, because the frame that comes back is the one
 * being rasterised when the capture request is serviced. Run the script and read
 * the verdict column: if it reports the wrong stage, shift the target.
 */
const SHOTS = [
  { label: '1-dark', at: 0.03 },
  { label: '2-earth', at: 0.18 },
  { label: '3-limb', at: 0.37 },
  { label: '4-solar', at: 0.55 },
  { label: '5-cosmic', at: 0.73 },
  { label: '6-closing', at: 0.89 },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class Session {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    this.errors = []
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
      for (const listener of this.listeners.get(message.method) ?? []) listener(message.params)
    })
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(listener)
  }

  send(method, params = {}, timeoutMs = 45_000) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} timed out`))
      }, timeoutMs)
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'evaluation threw')
    return result.result.value
  }

  /**
   * Stop the page's scripts so the sequence cannot advance while a frame is
   * grabbed.
   *
   * Only usable once per load: `performance.now()` keeps running while scripts
   * are disabled, so on thaw the sequence jumps forward by however long the
   * capture took. Freeze for a single decisive shot, not inside a loop.
   */
  async freeze() {
    await this.send('Emulation.setScriptExecutionDisabled', { value: true })
  }

  async thaw() {
    await this.send('Emulation.setScriptExecutionDisabled', { value: false })
  }

  async screenshot(path) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' }, 150_000)
    writeFileSync(path, Buffer.from(data, 'base64'))
  }
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
    await sleep(250)
  }
  throw new Error(`DevTools endpoint ${url} did not become ready`)
}

async function waitFor(session, expression, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await session.evaluate(expression)) return true
    await sleep(150)
  }
  return false
}

/** The sequence's own progress, read from the bar it animates. */
const PROGRESS = `
  (() => {
    const bar = document.querySelector('[data-testid="intro-overlay"] div[style*="scaleX"]')
    if (!bar) return -1
    const matrix = getComputedStyle(bar).transform
    return matrix.startsWith('matrix') ? Number(matrix.slice(7, -1).split(',')[0]) : -1
  })()
`

/**
 * Where each stage begins or ends as a fraction of the whole sequence. Mirrors
 * `INTRO_STAGE_STARTS` and `INTRO_TOTAL_SECONDS` in src/lib/introTimeline.ts.
 */
const STAGE_BOUNDARIES = [0, 0.1124, 0.3258, 0.5056, 0.6966, 0.8652]

/** 1-5 for the cinematic stages, 6 for the closing frame. */
function stageOf(progress) {
  let stage = 1
  for (let index = 1; index < STAGE_BOUNDARIES.length; index++) {
    if (progress >= STAGE_BOUNDARIES[index]) stage = index + 1
  }
  return stage
}

/** Everything the browser can tell us about the overlay right now. */
const OVERLAY_STATE = `
  (() => {
    const overlay = document.querySelector('[data-testid="intro-overlay"]')
    return {
      present: !!overlay,
      visible: overlay?.getAttribute('data-visible') ?? null,
      opacity: overlay ? getComputedStyle(overlay).opacity : null,
      progress: (() => {
        const bar = overlay?.querySelector('div[style*="scaleX"]')
        if (!bar) return null
        const matrix = getComputedStyle(bar).transform
        return matrix.startsWith('matrix') ? Number(matrix.slice(7, -1).split(',')[0]) : null
      })(),
      bodyOverflow: document.body.style.overflow,
      skipButton: !!(overlay?.querySelector('[data-intro-dismiss]')),
      text: (overlay?.textContent ?? '').replace(/\\s+/g, ' ').trim().slice(0, 120),
    }
  })()
`

const browserPath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
if (!browserPath) {
  console.error('No Chrome or Edge installation found.')
  process.exit(0)
}

mkdirSync(OUTPUT_DIR, { recursive: true })
const profileDir = mkdtempSync(join(tmpdir(), 'etu-intro-profile-'))

const browser = spawn(
  browserPath,
  [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--window-size=1280,720',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let session
try {
  const targets = await waitForEndpoint(`http://127.0.0.1:${DEBUG_PORT}/json/list`, 30_000)
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('No page target found')

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', () => reject(new Error('WebSocket failed')), { once: true })
  })
  session = new Session(socket)

  session.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    session.errors.push(exceptionDetails.exception?.description ?? exceptionDetails.text)
  })
  session.on('Runtime.consoleAPICalled', ({ type, args }) => {
    if (type !== 'error') return
    session.errors.push(args.map((arg) => arg.value ?? arg.description ?? '').join(' '))
  })

  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width,
    height: VIEW.height,
    deviceScaleFactor: 1,
    mobile: false,
  })

  const loaded = new Promise((resolve) => session.on('Page.loadEventFired', resolve))
  await session.send('Page.navigate', { url: BASE_URL })
  await loaded

  if (!(await waitFor(session, `!!document.querySelector('#top h1')`))) {
    throw new Error('The app never mounted')
  }

  console.log('\nOpening sequence - stills')
  console.log(`Target: ${BASE_URL}`)
  console.log(`Output: ${OUTPUT_DIR}\n`)

  const stages = ONLY_STAGE ? SHOTS.filter((_, index) => index === ONLY_STAGE - 1) : SHOTS

  // The sequence's clock starts when its overlay mounts, so wait for the overlay
  // rather than for the page.
  if (!(await waitFor(session, `!!document.querySelector('[data-testid="intro-overlay"]')`, 8000))) {
    throw new Error('The opening sequence never appeared')
  }

  // If it is not advancing, every shot below is wasted - say why, once.
  if (!(await waitFor(session, `${PROGRESS} > 0.005`, 30_000))) {
    const state = await session.evaluate(`
      (() => ({
        visibility: document.visibilityState,
        hidden: document.hidden,
        overlay: !!document.querySelector('[data-testid="intro-overlay"]'),
        progress: ${PROGRESS},
      }))()
    `)
    console.log('  the sequence is not advancing:', JSON.stringify(state))
    throw new Error('The opening sequence stalled before the first shot')
  }

  for (const shot of stages) {
    const alive = await session.evaluate(
      `!!document.querySelector('[data-testid="intro-overlay"]')`,
    )
    if (!alive) {
      console.log(`  ${shot.label.padEnd(10)} missed - the sequence already finished`)
      continue
    }

    const reached = await waitFor(session, `${PROGRESS} >= ${shot.at}`, 90_000)
    if (!reached) {
      console.log(`  ${shot.label.padEnd(10)} never reached progress ${shot.at}`)
      continue
    }
    const aimed = await session.evaluate(PROGRESS)
    const path = join(OUTPUT_DIR, `${shot.label}.png`)

    // A single-stage run is the one case where exactness is worth freezing for:
    // nothing follows it, so the clock jump on thaw costs nothing.
    const exact = ONLY_STAGE !== null
    if (exact) await session.freeze()
    await session.screenshot(path)
    if (exact) await session.thaw()

    const state = await session.evaluate(OVERLAY_STATE)
    const captured = state.progress ?? aimed
    const wanted = Number(shot.label[0])
    const got = stageOf(captured)
    const verdict = got === wanted ? 'ok' : `wanted stage ${wanted}`
    console.log(
      `  ${shot.label.padEnd(10)} stage ${got} of 6  aimed ${(aimed * 100).toFixed(0)}%, captured ${(captured * 100).toFixed(0)}%  ${verdict}`,
    )
    console.log(`             "${state.text}"`)
  }

  // --- the hero, at three widths -------------------------------------
  console.log('\nHero layout (no overlay)')
  for (const [label, width, height] of [
    ['8-hero-desktop', 1440, 900],
    ['9-hero-tablet', 768, 1024],
    ['10-hero-mobile', 390, 844],
  ]) {
    await session.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    })
    await sleep(1500)
    await session.screenshot(join(OUTPUT_DIR, `${label}.png`))
    const overflow = await session.evaluate(
      `({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth })`,
    )
    const ok = overflow.scrollWidth <= overflow.clientWidth + 1
    console.log(
      `  ${label.padEnd(16)} ${width}x${height}  ${ok ? 'no horizontal overflow' : `OVERFLOW +${overflow.scrollWidth - overflow.clientWidth}px`}`,
    )
  }
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width,
    height: VIEW.height,
    deviceScaleFactor: 1,
    mobile: false,
  })

  // --- skip behaviour -------------------------------------------------
  console.log('\nSkip button')
  const before = await session.evaluate(OVERLAY_STATE)
  if (!before.present) {
    console.log('  sequence already finished on its own - covered by the smoke test')
  } else {
    await session.evaluate(`document.querySelector('[data-intro-dismiss]')?.click()`)
    await sleep(1200)
    const after = await session.evaluate(OVERLAY_STATE)
    console.log(`  before: present=${before.present} visible=${before.visible}`)
    console.log(`  after:  present=${after.present} visible=${after.visible}`)
    if (after.present) console.log('  !! still up - something is wrong')
    await session.screenshot(join(OUTPUT_DIR, '7-after-skip.png'))
  }

  // --- the reduced-motion still ---------------------------------------
  // A second, separate design: no camera move at all, one frozen frame. Static,
  // so this capture is exact and cheap.
  console.log('\nReduced-motion still')
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await session.evaluate(`try { localStorage.removeItem('etu:intro-seen-v1') } catch {}`)
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width,
    height: VIEW.height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  const stillLoaded = new Promise((resolve) => session.on('Page.loadEventFired', resolve))
  await session.send('Page.reload')
  await stillLoaded
  if (await waitFor(session, `!!document.querySelector('[data-testid="intro-overlay"]')`, 20_000)) {
    await sleep(1500)
    await session.screenshot(join(OUTPUT_DIR, '11-still-reduced-motion.png'))
    const still = await session.evaluate(OVERLAY_STATE)
    console.log(`  captured 11-still-reduced-motion.png  "${still.text}"`)
  } else {
    console.log('  the still did not appear')
  }
  await session.send('Emulation.setEmulatedMedia', { features: [] })

  if (session.errors.length) {
    console.log('\nBrowser errors/warnings:')
    for (const error of session.errors.slice(0, 10)) console.log(`  - ${error}`)
  } else {
    console.log('\nNo browser errors.')
  }
  console.log('')
} finally {
  try {
    session?.socket?.close()
  } catch {
    /* already closed */
  }
  browser.kill()
}

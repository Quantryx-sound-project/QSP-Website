import type { PlanId } from "@/lib/products";

// Per-module explanation content shown on the product pages (accordion sections).
// English only. Sharp, no-filler tone. Content is grounded in the module docs.

import audioMeters1 from "@/assets/modules/audio-meters-1.png";
import audioMeters2 from "@/assets/modules/audio-meters-2.png";
import audioMeters3 from "@/assets/modules/audio-meters-3.png";
import audioMeters4 from "@/assets/modules/audio-meters-4.png";
import oscilloscope1 from "@/assets/modules/oscilloscope-1.png";
import oscilloscope2 from "@/assets/modules/oscilloscope-2.png";
import spectrum1 from "@/assets/modules/spectrum-1.png";
import spectrum2 from "@/assets/modules/spectrum-2.png";
import spectrogram1 from "@/assets/modules/spectrogram-1.png";
import spectrogram2 from "@/assets/modules/spectrogram-2.png";
import stereoGonio from "@/assets/modules/stereoscope-goniometer.png";
import stereoPolar from "@/assets/modules/stereoscope-polar.png";
import stereoCorr from "@/assets/modules/stereoscope-correlation.png";
import stereoParticles from "@/assets/modules/stereoscope-particles.png";
import tone1 from "@/assets/modules/tone-analyzer-1.png";
import tone2 from "@/assets/modules/tone-analyzer-2.png";
import chladni1 from "@/assets/modules/chladni-1.png";
import chladni2 from "@/assets/modules/chladni-2.png";
import chladni3 from "@/assets/modules/chladni-3.png";
import geometry1 from "@/assets/modules/geometry-1.png";
import geometry2 from "@/assets/modules/geometry-2.png";
import synesthesia1 from "@/assets/modules/synesthesia-1.png";
import synesthesia2 from "@/assets/modules/synesthesia-2.png";
import synesthesia3 from "@/assets/modules/synesthesia-3.webp";
import synesthesia4 from "@/assets/modules/synesthesia-4.webp";
import synesthesia5 from "@/assets/modules/synesthesia-5.webp";
import synesthesia6 from "@/assets/modules/synesthesia-6.webp";

export type ModuleCategory = "analysis" | "creative";

export interface ModuleImage {
  src: string;
  caption?: string;
}

export interface AlterModuleDoc {
  slug: string;
  title: string;
  summary: string; // one line, shown on the collapsed header
  category: ModuleCategory;
  availableIn: PlanId[];
  images: ModuleImage[];
  content: string[]; // paragraphs, shown when the section is expanded
}

export const alterOverview = {
  title: "What Alter is",
  summary:
    "Alter is a sound-focused platform made to explain, visualize and work with audio through a set of specialized modules.",
  why:
    "The goal is to turn audio analysis into something understandable and usable for creators instead of keeping it hidden behind technical tools.",
};

// One download for the whole documentation folder (all module DOCX in one ZIP).
export const fullDocsZipPath = "/docs/alter/ALTER_Full_Documentation.zip";

// Shared block shown once above the creative modules, so DAW automation is not re-explained per module.
export const dawAutomation = {
  title: "DAW automation (Creator plugin)",
  content: [
    "Every parameter you see in a module's controller also lives in the Creator VST plugin — Geometry, Synesthesia and Chladni included. Drop the plugin on a track in Ableton (or any DAW), hit Configure, and it exposes those parameters straight into the track, so you can automate them by hand on the timeline: draw Geometry's Complexity rising into a drop, ride Synesthesia's Bloom, morph Chladni's Shift across a breakdown.",
    "One thing to know so it doesn't surprise you: when automation is running from the plugin and you also grab a knob in the original controller, the app stores that only as a temporary state. The moment playback passes that point again, the automation writes its value back and overrides your manual change. So you can absolutely tweak by hand alongside automation — it just stays live only until it gets overwritten from the other side. Automation is the source of truth; manual moves are temporary until the playhead rewrites them.",
  ],
};

export const alterModules: AlterModuleDoc[] = [
  {
    slug: "audio-meters",
    title: "Audio Meters",
    summary: "Four modes, one signal, four different truths — RMS, LUFS, True Peak and Level History.",
    category: "analysis",
    availableIn: ["demo", "listener", "creator", "pro"],
    images: [
      { src: audioMeters1, caption: "Audio Meters — main view" },
      { src: audioMeters2, caption: "LUFS mode" },
      { src: audioMeters3, caption: "RMS mode" },
      { src: audioMeters4, caption: "True Peak mode" },
    ],
    content: [
      "Four modes, one signal, four different truths. RMS shows average energy — the weight and pressure that decide whether the next track feels weaker than this one. LUFS reads loudness the way ears actually feel it. True Peak catches the inter-sample overshoots a normal sample meter misses, which is exactly how a master that “measures fine” still clips through a lossy codec.",
      "The numbers that matter for delivery: streaming platforms normalise to roughly -14 LUFS integrated (Spotify and YouTube near -14, Apple Music nearer -16), while broadcast EBU R128 targets -23 LUFS. Keep True Peak under about -1 dBTP so codecs and consumer DACs don't clip on playback. Those are standards — hit them for delivery. Genre loudness “targets” are not: there is no official LUFS number for techno or pop, so treat genre levels as working zones, level-match, then trust your ears. If the louder version loses punch once matched, it isn't better — it's just louder before normalisation.",
      "The colour zones read at a glance: green is safe and controlled, yellow is the active target zone, orange is hot, red is clipping risk. The scale adapts to the mode — RMS runs -60 to 0 dBFS, while True Peak and LUFS extend to +6. A thin peak-hold marker holds the recent maximum (2 s in RMS, 3 s in True Peak and LUFS), and the MAX readout re-arms itself after 8 seconds without a new peak — so when the big number vanishes it's waiting for the next real maximum, not hiding one.",
      "Level History is the mode worth learning: the outer silhouette is peak movement, the inner body is RMS. A big gap means punch and headroom; when the two hug each other the sound is dense, compressed or limited — sometimes exactly what club music wants, sometimes a beautiful sausage you're calling a master. It catches motion a static number can't: a compressor pumping, a limiter clamping only on the drop, a breakdown that feels empty because the body dropped out, not the peak.",
    ],
  },
  {
    slug: "oscilloscope",
    title: "Oscilloscope",
    summary: "Wave motion in the time domain — shape, not loudness.",
    category: "analysis",
    availableIn: ["demo", "listener", "creator", "pro"],
    images: [
      { src: oscilloscope1, caption: "Short-Term Scope" },
      { src: oscilloscope2, caption: "Long Waveform" },
    ],
    content: [
      "The Oscilloscope draws actual wave motion in the time domain — not how loud, but what shape. Short-Term Scope is the waveform microscope for single cycles and phase; Long Waveform is the timeline view for structure and arrangement. Using one zoom for everything is the classic trap: short windows answer cycle questions, long windows answer structure questions.",
      "A beautiful waveform can still sound like garbage, and a flat or squared top is not automatically clipping — plenty of synths and distortion designs are meant to look like that. This is a shape tool, not a loudness meter; if you want RMS or True Peak numbers, that's Audio Meters' job.",
    ],
  },
  {
    slug: "spectrum-analyzer",
    title: "Spectrum Analyzer",
    summary: "A frequency microscope — FFT bins, resolution, and when to reach for Constant-Q.",
    category: "analysis",
    availableIn: ["demo", "listener", "creator", "pro"],
    images: [
      { src: spectrum1, caption: "Spectrum Analyzer" },
      { src: spectrum2, caption: "Measurement view" },
    ],
    content: [
      "The Spectrum Analyzer is a frequency microscope, not a mix judge. It turns the waveform into “there's energy around 60 Hz, 200 Hz, 3 kHz” using an FFT, at up to 8192 bins set by the global FFT Resolution (2048 / 4096 / 8192).",
      "More bins isn't automatically better. More bins mean more detail — great when hunting a resonance — but it's chaos on stage, it costs CPU, and it doesn't fix the low end. A bin is a finite-time measurement, not a shelf holding one exact frequency: at a 4096-sample FFT and 48 kHz, bins sit about 11.7 Hz apart. Around 40 Hz that's a big musical chunk; around 10 kHz it's tiny. So a clean low sine draws a wide hill, not a laser line. That's FFT physics, not the analyzer lying — the ruler is just naturally wider in the basement.",
      "That's why Constant-Q mode exists. Instead of one fixed time window it analyses with three at once — long for bass, medium for mids, short for highs — so every log-spaced band from the sub up to 20 kHz gets fair resolution and each semitone reads clearly. The catch: because each band uses a different window and bandwidth, Constant-Q is built for tones and notes, not for honest energy measurement. When you need to compare actual energy or make EQ and mastering calls, switch to the linear FFT in Measurement mode; use Constant-Q to read basslines, chords and harmony.",
      "Peak Hold draws a slowly decaying maximum over the live curve, so the fast resonance at 3.5 kHz that vanished before your brain could name it stays visible long enough to hunt down. And Stereo (L+R) overlays the left and right spectra — useful for catching a hat that's too bright on one side or a wide top end that turns to soup in mono.",
    ],
  },
  {
    slug: "spectrogram",
    title: "Spectrogram",
    summary: "Frequency energy over time — three engines, with Enhanced Frequency as the forensic one.",
    category: "analysis",
    availableIn: ["listener", "pro"],
    images: [
      { src: spectrogram1, caption: "Spectrogram" },
      { src: spectrogram2, caption: "Display engine comparison" },
    ],
    content: [
      "The Spectrogram maps frequency energy over time — horizontal lines are sustained tones, vertical stripes are transients, a bright low band is bass pressure, a high wash is air or noise. The Window control is not cosmetic: short windows reveal transient detail, long windows reveal structure. Hunting a tiny click with a long window is like using Google Maps to find a screw on the floor.",
      "Three display engines answer different questions about the same audio. Linear FFT is the low-CPU workhorse with balanced detail, but one fixed bin covers a big musical distance in the sub range, so deep bass rows are naturally coarse. Constant-Q runs multi-resolution analysis — long window for bass, short for highs — so every semitone from sub to 20 kHz gets fair resolution; use it for basslines, chords and harmony.",
      "Enhanced Frequency is the forensic mode, and the reason to care. It processes every incoming sample gap-free with heavy window overlap, then reassigns each FFT bin's energy to its TRUE instantaneous frequency and its true moment in time — time and frequency reassignment. Steady tones collapse into razor-thin lines and transients stay sharp instead of smearing into fuzzy blobs, so you can actually see a slightly detuned layer, a drifting oscillator or a click hiding inside a pad. It costs the most CPU; it's the mode you switch to when you need the truth, not a stage visual.",
      "One habit to drop: bright doesn't mean better. Brightness is energy, not taste — it can be air and detail, or hiss, harshness and clipping dirt. And it's not a loudness meter; for RMS, LUFS and True Peak, that's Audio Meters.",
    ],
  },
  {
    slug: "stereoscope",
    title: "Stereoscope",
    summary: "Whether your stereo image has a spine — five views, including the new Correlometer.",
    category: "analysis",
    availableIn: ["listener", "pro"],
    images: [
      { src: stereoGonio, caption: "Goniometer" },
      { src: stereoPolar, caption: "Polar" },
      { src: stereoCorr, caption: "Correlation" },
      { src: stereoParticles, caption: "Particles" },
    ],
    content: [
      "StereoScope tells you whether your stereo image has a spine — what's centred, what's wide, what's leaning, and what vanishes the moment a club sums your mix to mono. It reads Mid (L+R, the shared centre: kick, bass, vocal, snare) against Side (L−R, the difference: reverbs, widening, hard-panned content), plus correlation, which compares left and right: +1 is mono-safe, 0 is wide/decorrelated, −1 is anti-phase — the mono-cancellation monster.",
      "Five views of that. Particles maps frequency vertically and side energy horizontally, so you catch a sub that's spraying sideways when it should be locked to the centre. Goniometer is the classic Lissajous vectorscope. Polar turns phase into direction from a bottom-centre origin. Correlation scrolls the L/R relationship over time — the mono-survival history. And Correlometer is the live, single-value correlation reading: an instant +1…−1 meter for the moment you're in, where Correlation mode scrolls that same value as history.",
      "Two things confuse people about the Goniometer. First, why L and R sit on 45° diagonals: the scope plots Mid vertically and Side horizontally, so a pure-mono signal (L=R, all Side cancels) draws a vertical line, while a signal living on one channel leans onto that channel's ±45° axis. The ±45° guides are practical warning lines, not physical law — a hard-panned mono part can legitimately sit near a side guide; the real trouble is important material staying beyond it for too long.",
      "Second, why distortion turns a clean blob into a rhombus. Clipping and hard distortion flatten the peaks, so the signal spends most of its time pinned at maximum amplitude on both channels. Those maxed-out points pile up at the extremes along the L and R diagonals, and the trace outlines a diamond — the four corners are the clipped peaks sitting on the ±45° axes. A rhombus on the goniometer is a fingerprint of a squared, saturated signal, not a wider one.",
      "Rules of thumb: wider is not better — a mix that feels huge for five seconds can collapse in mono. A single negative correlation spike from a stereo effect is normal; sustained negative on the kick or bass is the warning. Trust it over headphones, which exaggerate separation by feeding each ear its own channel. And it's not the tool for delivery peaks — that's Audio Meters, because inter-sample True Peak is a separate problem.",
    ],
  },
  {
    slug: "tone-analyzer",
    title: "Tone Analyzer",
    summary: "What note and chord is playing — a fast helper, not a lab-grade tuner.",
    category: "analysis",
    availableIn: ["listener", "pro"],
    images: [
      { src: tone1, caption: "Tone Analyzer" },
      { src: tone2, caption: "Chord detection" },
    ],
    content: [
      "Tone Analyzer detects the pitch classes in the signal and names the chord. It scans 55 Hz–5 kHz for strict local peaks, suppresses harmonics so one real note doesn't spawn a fake army of overtones, keeps only peaks within 18 dB of the strongest, waits ~130 ms so random transients don't flicker in and out, holds up to five notes at once, then matches templates: major, minor, 7th, sus, dim, aug, 6, m6, add9. Major reads happy and stable, minor darker, diminished tense, augmented floating and unresolved.",
      "Why it isn't a precise tuner, and shouldn't be treated as one: it works in pitch classes, so octaves fold together and each semitone is a soft zone around a centre frequency, not a hard wall. In real audio the chord is guessed from the strongest stable root, so dense, overlapping or distorted material can land on a neighbouring template — a seventh reading as its relative, a sus reading as unresolved. And when the material is too noisy, too distorted or too high, the analyzer stops pretending and simply holds the last stable result. It's a fast musical helper for finding a key, tuning an 808 or checking stacked vocals — not a lab-grade pitch detector.",
    ],
  },
  {
    slug: "chladni-patterns",
    title: "Chladni Patterns",
    summary: "Sound organising into plate figures — and how close to real plate physics it actually is.",
    category: "creative",
    availableIn: ["creator", "pro"],
    images: [
      { src: chladni1, caption: "Mode (4,6)" },
      { src: chladni2, caption: "Mode (2,3)" },
      { src: chladni3, caption: "Mode (7,9)" },
    ],
    content: [
      "Chladni Patterns turns resonance into the sand-on-a-vibrating-plate figures from the real experiment. It runs a rectangular plate modal field where each pattern is two mode indices, m and n: small numbers give broad, readable figures, large numbers give fine, dense geometry. The audio does not map bass to one axis and treble to another — ALTER takes the dominant, ear-weighted frequency and picks the whole (m,n) mode closest to it, so the sound grabs the entire plate shape. Loudness only shakes the sand harder; the tone chooses the figure. Change Material or Aspect Ratio and the same note can settle into a different figure, exactly like a real surface would.",
      "How physically accurate is it, honestly: it's a real-time artistic plate model, not a million-element laboratory simulation. The nodal geometry follows genuine plate-vibration theory — standing-wave modes, nodal lines where the sand settles — and the audio-to-mode map is a fixed reference table you can read in the documentation. But it's tuned to look alive and react musically at 60 fps, not to be calibrated against a specific manufactured steel plate. It's physically inspired and correct in shape and behaviour; it is not a promise of lab measurement. Treat it as a demonstrator of resonance, not a metrology instrument — pitch chooses the geometry, loudness shakes the sand.",
    ],
  },
  {
    slug: "geometry",
    title: "Geometry",
    summary: "A perspective tunnel of shapes — probability weights, FREE vs BPM, and how not to torch your GPU.",
    category: "creative",
    availableIn: ["creator", "pro"],
    images: [
      { src: geometry1, caption: "Geometry tunnel" },
      { src: geometry2, caption: "Geometry — alternate look" },
    ],
    content: [
      "Geometry is a perspective tunnel built from triangles, squares and circles. First thing people miss: the shape buttons aren't on/off — they're probability weights. High Triangle and low Circle means the pool mostly spawns triangles; equal values give a mixed engine; one shape owning the pool gives a strong visual identity.",
      "FREE and BPM are two different spawn engines. In FREE mode, Complexity is how many shapes exist at once in the ring and Speed sets how fast they travel. In BPM mode, Complexity becomes shapes-per-burst, fired on the beat — Beat Div picks the division (with dotted and triplet variants) and, with the Creator plugin on a track, it phase-locks to your DAW tempo and song position so bursts land exactly on the grid and can't drift.",
      "This is where you can quietly waste your GPU. If BPM mode fires a burst but Tunnel is at 1, Random is at 0 and only Triangle is on, every object in that burst is born in the same place with the same rotation — they stack into what looks like a single shape while your machine still renders every one of them. Spread them out (Random for birth angle, mixed shapes, Tunnel below 1) or drop Complexity and you get the same look for a fraction of the cost.",
      "The rest of the controls: Depth is spawn distance, not reverb or blur — low Depth is a shallow tunnel with big near shapes, high Depth starts them tiny and rushes them in. Tunnel morphs from shapes spread around the centre (0) into a fly-through tube (1). Aperture is the iris. Module Rot spins the whole scene on top of per-shape rotation and is bipolar — negative spins the other way. Tone colour maps the detected note to a colour family, so pitch drives the palette.",
    ],
  },
  {
    slug: "synesthesia",
    title: "Synesthesia",
    summary: "A fractal field driven by tone and level, where colour follows pitch.",
    category: "creative",
    availableIn: ["creator", "pro"],
    images: [
      { src: synesthesia1, caption: "Synesthesia" },
      { src: synesthesia3, caption: "Colour follows pitch — magenta bloom" },
      { src: synesthesia4, caption: "Fragment morph — green field" },
      { src: synesthesia5, caption: "Transmute rings — teal" },
      { src: synesthesia6, caption: "Bloom + glow — blue/magenta" },
      { src: synesthesia2, caption: "Synesthesia — variation" },
    ],
    content: [
      "Synesthesia is the emotional translator — a fractal field driven by the dominant tone and RMS, where colour follows pitch class, so the same note always drives the same hue and the palette repeats every octave. It's a performance visual, not a meter.",
      "The four sculpting controls do different jobs and their names lie a little. Fragment morphs the structure and rotates the palette identity. Transmute is a second, symmetric morph — radial rings and lens-waves that keep the composition centred. Clear strips layers from the top to calm the image while keeping it reactive. Denoise does not touch audio noise — it fuses the thin dashed secondary curves into continuous lines and dims them so the back layers stay behind the main stroke instead of competing with it. Thickness and glow are Bloom, not Denoise.",
      "BPM sync doesn't speed up the fractal's evolution — it adds a light wave that sweeps outward from the centre on each beat division. Beat Div picks the division, BPM sets the tempo, and with the Creator plugin it phase-locks to the DAW transport so the flash lands on the host's beats when you play from the top.",
    ],
  },
];

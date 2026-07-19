import type { PlanId } from "@/lib/products";

export interface AlterModuleDoc {
  slug: string;
  title: string;
  summary: string;
  docPath: string;
  availableIn: PlanId[];
}

export const alterOverview = {
  title: "What Alter is",
  summary:
    "Alter is a sound-focused platform made to explain, visualize and work with audio through a set of specialized modules.",
  why:
    "The goal is to turn audio analysis into something understandable and usable for creators instead of keeping it hidden behind technical tools.",
};

export const alterModules: AlterModuleDoc[] = [
  {
    slug: "audio-meters",
    title: "Audio Meters",
    summary: "Shows input level, dynamics and signal activity in a clear meter-based view.",
    docPath: "/docs/alter/modules/audio-meters/ALTER_Audio_Meters_Documentation.docx",
    availableIn: ["demo", "listener", "pro"],
  },
  {
    slug: "chladni-patterns",
    title: "Chladni Patterns",
    summary: "Turns vibration and resonance into visual pattern studies.",
    docPath: "/docs/alter/modules/chladni-patterns/ALTER_Chladni_Patterns_Documentation.docx",
    availableIn: ["creator", "pro"],
  },
  {
    slug: "geometry",
    title: "Geometry",
    summary: "Explains the spatial and structural layer of the visual language.",
    docPath: "/docs/alter/modules/geometry/ALTER_Geometry_Documentation.docx",
    availableIn: ["creator", "pro"],
  },
  {
    slug: "oscilloscope",
    title: "Oscilloscope",
    summary: "Displays wave motion and time-domain behavior of the signal.",
    docPath: "/docs/alter/modules/oscilloscope/ALTER_Oscilloscope_Documentation.docx",
    availableIn: ["demo", "listener", "pro"],
  },
  {
    slug: "spectrogram",
    title: "Spectrogram",
    summary: "Maps the frequency content of the signal over time.",
    docPath: "/docs/alter/modules/spectrogram/ALTER_Spectrogram_Documentation.docx",
    availableIn: ["listener", "pro"],
  },
  {
    slug: "spectrum-analyzer",
    title: "Spectrum Analyzer",
    summary: "Breaks the signal into frequency bands for detailed analysis.",
    docPath: "/docs/alter/modules/spectrum-analyzer/ALTER_Spectrum_Analyzer_Documentation.docx",
    availableIn: ["demo", "listener", "pro"],
  },
  {
    slug: "stereoscope",
    title: "Stereoscope",
    summary: "Shows stereo width, balance and the perceived space of the mix.",
    docPath: "/docs/alter/modules/stereoscope/ALTER_Stereoscope_Documentation.docx",
    availableIn: ["listener", "pro"],
  },
  {
    slug: "synesthesia",
    title: "Synesthesia",
    summary: "Connects sound states with visual interpretation and expression.",
    docPath: "/docs/alter/modules/synesthesia/ALTER_Synesthesia_Documentation.docx",
    availableIn: ["creator", "pro"],
  },
  {
    slug: "tone-analyzer",
    title: "Tone Analyzer",
    summary: "Highlights tone, character and tonal balance in the source material.",
    docPath: "/docs/alter/modules/tone-analyzer/ALTER_Tone_Analyzer_Documentation.docx",
    availableIn: ["listener", "pro"],
  },
];

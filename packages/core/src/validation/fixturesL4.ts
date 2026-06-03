import { l4MaterialSamples } from "../maxwell/materials";
import type { PlanarTmmInput } from "../maxwell/planarTmm";

export const l4WavelengthM = 550e-9;

export const l4BareGlassTmm: PlanarTmmInput = {
  id: "l4-bare-glass",
  label: "L4 Phase 0 bare air/glass interface",
  wavelengthM: l4WavelengthM,
  angleRad: 0,
  polarization: "TE",
  incidentMedium: l4MaterialSamples.air,
  substrateMedium: l4MaterialSamples.bk7,
  layers: []
};

export const l4QuarterWaveArTmm: PlanarTmmInput = {
  id: "l4-quarter-wave-ar",
  label: "L4 Phase 0 quarter-wave MgF2 AR coating",
  wavelengthM: l4WavelengthM,
  angleRad: 0,
  polarization: "TE",
  incidentMedium: l4MaterialSamples.air,
  substrateMedium: l4MaterialSamples.bk7,
  layers: [
    {
      id: "mgf2-quarter-wave",
      label: "MgF2 quarter-wave layer",
      material: l4MaterialSamples.mgf2,
      thicknessM: l4WavelengthM / (4 * l4MaterialSamples.mgf2.refractiveIndex.n)
    }
  ]
};

export const l4AbsorbingFilmTmm: PlanarTmmInput = {
  id: "l4-lossy-film",
  label: "L4 Phase 0 lossy film on glass",
  wavelengthM: l4WavelengthM,
  angleRad: 0,
  polarization: "TE",
  incidentMedium: l4MaterialSamples.air,
  substrateMedium: l4MaterialSamples.bk7,
  layers: [
    {
      id: "lossy-chromium-like-layer",
      label: "Lossy chromium-like layer",
      material: l4MaterialSamples.chromiumLossy,
      thicknessM: 18e-9
    }
  ]
};

export const l4ObliqueStackTmm: PlanarTmmInput = {
  ...l4QuarterWaveArTmm,
  id: "l4-oblique-ar",
  label: "L4 Phase 0 oblique AR coating",
  angleRad: (35 * Math.PI) / 180,
  polarization: "TM"
};

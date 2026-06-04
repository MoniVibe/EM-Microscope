export interface ExplainEntry {
  id: string;
  section: "Validation Bench" | "Backend Panel" | "Coating Materials" | "Search And Robustness" | "Exports";
  title: string;
  short: string;
  physicalMeaning?: string;
  units?: string;
  formula?: string;
  underTheHood?: string;
  snippet?: string;
  assumptions?: string[];
  limitations?: string[];
  relatedInputs?: string[];
  relatedOutputs?: string[];
}

export const explainEntries = [
  {
    id: "validation.source.wavelength",
    section: "Validation Bench",
    title: "Wavelength",
    short: "Wavelength of the monochromatic source. The default is 500 nm, so diffraction features match visible-light lab-scale hand checks.",
    physicalMeaning: "Sets the optical phase scale and therefore the diffraction feature spacing.",
    units: "nanometers in the UI; meters in solver data.",
    formula: "k = 2 pi / lambda",
    underTheHood: "Validation benchmarks pass wavelength into the analytic reference and independent scalar propagation path. Changing wavelength shifts expected minima and fringe spacing.",
    assumptions: ["Monochromatic source mode.", "Time-averaged scalar intensity is reported."],
    limitations: ["This does not model spectral bandwidth, fluorescence, or sensor color response."]
  },
  {
    id: "validation.source.pointSource",
    section: "Validation Bench",
    title: "Point Source Mode",
    short: "A single monochromatic spatial mode used by the circular aperture validation. It is not a full extended illumination model.",
    physicalMeaning: "Defines the incident scalar field feeding the ideal aperture.",
    units: "position in millimeters in the UI; meters in solver data.",
    underTheHood: "The circular benchmark treats the point emitter as one coherent mode before sampling intensity at the observation plane.",
    assumptions: ["Single coherent source mode."],
    limitations: ["No multi-point incoherent source summation in this validation case."]
  },
  {
    id: "validation.aperture.circularDiameter",
    section: "Validation Bench",
    title: "Circular Aperture Diameter",
    short: "Diameter of the ideal zero-thickness circular opening. This benchmark uses a circular aperture because the analytic check is the Airy/Bessel pattern.",
    physicalMeaning: "Controls the radius used in the Airy/Bessel first-minimum formula.",
    units: "micrometers.",
    formula: "k a sin(theta) = 3.831705970...",
    assumptions: ["Ideal amplitude mask.", "Zero thickness aperture."],
    limitations: ["No finite metal thickness, edge boundary conditions, or vector subwavelength aperture effects."]
  },
  {
    id: "validation.aperture.z",
    section: "Validation Bench",
    title: "Aperture Z Position",
    short: "Axial location of the ideal aperture mask. It sets the propagation distance from source to aperture in the validation path.",
    units: "millimeters in UI; meters in solver data.",
    limitations: ["The aperture is a mathematical mask, not a physical material volume."]
  },
  {
    id: "validation.observation.zPlane",
    section: "Validation Bench",
    title: "Observation Plane Z",
    short: "Axial location where intensity is sampled. Moving it changes the propagation distance and the expected diffraction scale.",
    units: "millimeters.",
    underTheHood: "The UI recomputes the circular aperture validation when this distance changes, including expected Airy radius and residual metrics.",
    limitations: ["This is an observation plane, not a sensor model."]
  },
  {
    id: "validation.observation.zeroThicknessPlane",
    section: "Validation Bench",
    title: "Zero-Thickness Observation Plane",
    short: "A mathematical plane where scalar intensity is sampled. It is not a sensor volume and does not model pixel absorption.",
    physicalMeaning: "Stores normalized intensity samples on a 2D grid.",
    units: "plane size in millimeters; intensity is relative.",
    limitations: ["No sensor stack, photoelectron conversion, read noise, or pixel absorption model."]
  },
  {
    id: "validation.observation.planeSize",
    section: "Validation Bench",
    title: "Observation Plane Size",
    short: "Physical width and height covered by the sampled intensity map. If a predicted minimum lies outside this plane, the app reports that explicitly.",
    units: "millimeters.",
    limitations: ["A finite plane can miss off-axis diffraction features."]
  },
  {
    id: "validation.numericalPropagation.huygensFresnel",
    section: "Validation Bench",
    title: "Numerical Scalar Propagation",
    short: "Independent scalar Huygens-Fresnel propagation. This is scalar diffraction validation, not full vector Maxwell/FDTD aperture solving.",
    physicalMeaning: "Computes a numerical field so the UI is not merely drawing the closed-form reference.",
    formula: "U(rho) ~= integral_aperture exp(i k (R - L)) r dr dphi",
    underTheHood: "The circular benchmark performs deterministic radial/angular aperture quadrature, normalizes the map, and compares the result against the Airy/Bessel reference.",
    snippet: "for each observation radius:\n  integrate aperture samples exp(i * k * path_difference)\n  intensity = |U|^2\n  normalize by peak intensity",
    assumptions: ["Scalar diffraction approximation.", "Ideal zero-thickness circular aperture."],
    limitations: ["No full 3D Maxwell, FDTD, FEM, BEM, RCWA, finite-thickness aperture, or sensor transport execution."]
  },
  {
    id: "validation.analyticReference.airyBessel",
    section: "Validation Bench",
    title: "Airy/Bessel Analytic Reference",
    short: "Closed-form circular-aperture reference: I/I0 = [2 J1(x)/x]^2. The numerical map is compared against this reference.",
    physicalMeaning: "Hand-check target for the circular aperture intensity pattern.",
    formula: "I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2",
    underTheHood: "The first dark ring is predicted from the first zero of J1. The UI reports whether that radius is inside the finite observation plane.",
    snippet: "x = k * aperture_radius * sin(theta)\nintensity = square(2 * J1(x) / x)",
    assumptions: ["Circular aperture.", "Scalar diffraction reference."],
    limitations: ["Not a finite-thickness or vector aperture solution."]
  },
  {
    id: "validation.firstAiryMinimum",
    section: "Validation Bench",
    title: "First Airy Minimum",
    short: "The first dark ring occurs when k a sin(theta) = 3.831705970... The default geometry predicts about 7.69 mm from center.",
    physicalMeaning: "Reference feature used to verify whether the detector plane is wide enough.",
    units: "millimeters from optical axis.",
    formula: "rho = L tan(arcsin(3.831705970 / (k a)))",
    snippet: "sinTheta = 3.831705970 / (k * apertureRadius)\nrho = propagationDistance * sinTheta / sqrt(1 - sinTheta^2)"
  },
  {
    id: "validation.residualMap",
    section: "Validation Bench",
    title: "Residual Map",
    short: "Difference between normalized numerical intensity and analytic reference. It shows where computed propagation disagrees with the hand-check formula.",
    physicalMeaning: "Spatial error view for numerical-versus-analytic validation.",
    units: "relative normalized intensity difference.",
    formula: "residual = I_numerical - I_analytic",
    limitations: ["Residuals are validation diagnostics, not manufacturing tolerances."]
  },
  {
    id: "validation.rmsResidual",
    section: "Validation Bench",
    title: "RMS Residual",
    short: "Root-mean-square residual over sampled points. Lower values mean closer agreement with the analytic reference on the sampled grid.",
    units: "relative normalized intensity.",
    formula: "rms = sqrt(mean((I_numerical - I_analytic)^2))",
    snippet: "sumSquared = residuals.reduce((sum, r) => sum + r*r, 0)\nrms = sqrt(sumSquared / residualCount)"
  },
  {
    id: "validation.maxResidual",
    section: "Validation Bench",
    title: "Max Residual",
    short: "Largest absolute numerical-minus-analytic mismatch on the sampled map or profile.",
    units: "relative normalized intensity.",
    formula: "maxResidual = max(abs(I_numerical - I_analytic))"
  },
  {
    id: "validation.finitePlaneEnergy",
    section: "Validation Bench",
    title: "Finite-Plane Energy Check",
    short: "Compares peak-normalized numerical and analytic intensity integrals over the finite detector plane.",
    units: "relative integral error.",
    formula: "relativeError = abs(sumNumerical - sumAnalytic) / sumAnalytic",
    limitations: ["This is a finite-plane sanity check, not total optical power conservation for a full physical system."]
  },
  {
    id: "validation.samplingControls",
    section: "Validation Bench",
    title: "Sampling Controls",
    short: "Grid and quadrature counts used by the numerical validation. Higher samples improve convergence at greater compute cost.",
    physicalMeaning: "Controls numerical resolution, not physical geometry.",
    limitations: ["Coarse sampling can increase residuals without indicating a physics change."]
  },
  {
    id: "validation.lens.thinLensPhase",
    section: "Validation Bench",
    title: "Thin-Lens Phase Mask",
    short: "Ideal zero-thickness lens model used by the L6.4 focal-plane validation.",
    physicalMeaning: "Applies the quadratic phase needed to focus a coherent plane wave at focal length f.",
    units: "phase in radians; focal length in millimeters in the UI.",
    formula: "tau_lens(u,v) = P(u,v) exp[-i k (u^2 + v^2) / (2f)]",
    underTheHood: "The numerical path integrates scalar Fresnel propagation through this phase mask and circular pupil, then compares the focal-plane map against an analytic Airy PSF.",
    snippet: "phase = -k * (u*u + v*v) / (2*f)\nfield *= pupil(u,v) * exp(i * phase)",
    assumptions: ["Coherent monochromatic plane wave.", "Paraxial scalar thin-lens approximation.", "Zero-thickness phase mask."],
    limitations: ["No real curved glass geometry, finite thickness, dispersion, coatings, polarization, or aberrations."]
  },
  {
    id: "validation.lens.focalLength",
    section: "Validation Bench",
    title: "Focal Length",
    short: "Distance from the ideal thin lens to the nominal focal plane.",
    physicalMeaning: "Sets the scale of the Airy spot and the z location where the focus scan should peak.",
    units: "millimeters.",
    formula: "r1 ~= 1.22 lambda f / D",
    limitations: ["This is an ideal paraxial focal length, not a measured thick-lens back focal length."]
  },
  {
    id: "validation.lens.pupil",
    section: "Validation Bench",
    title: "Circular Pupil",
    short: "Finite clear diameter of the ideal lens aperture. It clips the focused wave and creates the diffraction-limited Airy spot.",
    physicalMeaning: "Controls the numerical aperture estimate and the first dark ring radius.",
    units: "micrometers.",
    formula: "P(u,v) = 1 for sqrt(u^2+v^2) <= D/2, otherwise 0",
    limitations: ["No aperture thickness, edge material, mount, coating, or vector boundary condition is modeled."]
  },
  {
    id: "validation.lens.airyRadius",
    section: "Validation Bench",
    title: "Focal-Plane Airy Radius",
    short: "Hand-check radius of the first dark ring for an ideal focused circular pupil.",
    physicalMeaning: "For defaults, 500 nm, f=20 mm, and D=200 um predict about 61 um.",
    units: "micrometers from optical axis.",
    formula: "r1 ~= 1.22 lambda f / D",
    snippet: "r1 = 1.21967 * wavelength * focalLength / pupilDiameter",
    limitations: ["Valid for the ideal scalar diffraction-limited focal plane, not a defocused, aberrated, or material lens."]
  },
  {
    id: "validation.lens.focusMetric",
    section: "Validation Bench",
    title: "Focus Metric",
    short: "Relative center intensity across a z scan around the focal plane.",
    physicalMeaning: "The coherent field should concentrate near z=f, so the metric peaks near the nominal focus.",
    units: "relative normalized intensity; z in millimeters.",
    formula: "metric(z) = I_center(z) / max_z I_center(z)",
    limitations: ["This is a scalar focus diagnostic, not autofocus, sensor response, or thick-lens metrology."]
  },
  {
    id: "validation.lens.scalarLimitations",
    section: "Validation Bench",
    title: "Thin-Lens Scalar Limitations",
    short: "Boundary language for L6.4: ideal scalar diffraction validation only.",
    underTheHood: "The lens benchmark validates a hand-checkable diffraction-limited focal plane before any real lens/material solver exists.",
    limitations: [
      "No full 3D Maxwell, FDTD, FEM, BEM, RCWA, or ray tracing.",
      "No finite-thickness glass, dispersion, coatings, polarization, aberrations, sensor transport, or microscope digital twin."
    ]
  },
  {
    id: "validation.exports",
    section: "Exports",
    title: "Validation Exports",
    short: "JSON and Markdown validation reports include formulas, residuals, warnings, hashes, and limitation language.",
    underTheHood: "Exports are generated from the current validation result object so reviewers can inspect the same evidence shown in the UI.",
    limitations: ["Exports are validation evidence, not certification reports."]
  },
  {
    id: "backend.planarTmm",
    section: "Backend Panel",
    title: "PlanarTmmBackend",
    short: "The only executable Maxwell backend in this app. It solves the 1D planar multilayer transfer-matrix special case for coating stacks.",
    physicalMeaning: "Frequency-domain boundary-condition solution for planar films.",
    formula: "planar stack -> characteristic matrices -> R/T/A",
    snippet: "problem.kind = 'planar-stack'\nbackend = PlanarTmmBackend\nresult = solveCoatingStack(problem)",
    assumptions: ["Planar layers.", "Frequency-domain TMM special case."],
    limitations: ["No arbitrary 3D geometry, curved optics, aperture diffraction, FDTD, FEM, BEM, RCWA, or digital twin execution."]
  },
  {
    id: "backend.dimension1dPlanar",
    section: "Backend Panel",
    title: "1D Planar Dimension",
    short: "The executable Maxwell path varies only through the film-stack depth. It is not a general 3D volume field solve.",
    units: "planar stack depth in meters or nanometers.",
    limitations: ["No 3D CAD domain is solved."]
  },
  {
    id: "backend.externalFdtdScaffold",
    section: "Backend Panel",
    title: "ExternalFdtdBackend",
    short: "A scaffold/export-only future backend. It can export a manifest/script skeleton but cannot run a 3D FDTD solve in this app.",
    underTheHood: "The scaffold defines scene/result contracts and Meep-style export text. Calling solve remains unsupported.",
    snippet: "ExternalFdtdBackend.status = 'scaffold-only'\nsolve() throws UnsupportedBackendError",
    limitations: ["No FDTD execution, no WebAssembly FDTD, and no validated external job runner."]
  },
  {
    id: "backend.capabilityReceipt",
    section: "Backend Panel",
    title: "Backend Capability Receipt",
    short: "Machine-readable evidence describing what a backend can and cannot do.",
    underTheHood: "The receipt distinguishes the executable planar backend from scaffold-only future backends.",
    limitations: ["A capability receipt is metadata; it is not proof of unsupported solver execution."]
  },
  {
    id: "coating.materialId",
    section: "Coating Materials",
    title: "Material ID",
    short: "Stable material reference used to resolve wavelength-dependent n/k samples before running planar TMM.",
    physicalMeaning: "Selects optical constants for each layer.",
    limitations: ["Built-in records are diagnostic unless imported provenance is supplied."]
  },
  {
    id: "coating.provenanceReceipt",
    section: "Coating Materials",
    title: "Material Provenance Receipt",
    short: "Shows whether a material is built-in diagnostic or imported, plus hashes that identify the source record or pack.",
    underTheHood: "Imported packs receive deterministic hashes so stack designs can preserve material identity.",
    snippet: "receipt = { materialId, materialHash, sourcePackHash, wavelengthRange }"
  },
  {
    id: "coating.nk",
    section: "Coating Materials",
    title: "n/k Optical Constants",
    short: "Refractive index n and extinction coefficient k used by the planar coating solve at the selected wavelength.",
    physicalMeaning: "n controls phase velocity; k controls absorption.",
    limitations: ["No material uncertainty or Kramers-Kronig validation is executed here."]
  },
  {
    id: "coating.thickness",
    section: "Coating Materials",
    title: "Layer Thickness",
    short: "Physical film thickness used by the planar TMM stack.",
    units: "nanometers in UI; meters in solver data.",
    limitations: ["No roughness, wedge, stress, or thermal deformation model."]
  },
  {
    id: "coating.reflectance",
    section: "Coating Materials",
    title: "Reflectance",
    short: "Fraction of incident optical power reflected by the planar stack for the selected wavelength, angle, and polarization.",
    units: "percent in UI; unitless ratio in solver data.",
    formula: "R = reflected flux / incident flux"
  },
  {
    id: "coating.transmittance",
    section: "Coating Materials",
    title: "Transmittance",
    short: "Fraction of incident optical power transmitted through the planar stack.",
    units: "percent in UI; unitless ratio in solver data.",
    formula: "T = transmitted flux / incident flux"
  },
  {
    id: "coating.absorbance",
    section: "Coating Materials",
    title: "Absorbance",
    short: "Remainder of incident power not reflected or transmitted in the planar stack calculation.",
    units: "percent in UI; unitless ratio in solver data.",
    formula: "A = 1 - R - T"
  },
  {
    id: "coating.energyBalance",
    section: "Coating Materials",
    title: "Energy Balance",
    short: "Numerical closure check for R + T + A. Small values indicate the planar TMM computation is internally consistent.",
    units: "unitless residual.",
    formula: "energyError = abs(R + T + A - 1)"
  },
  {
    id: "coating.fieldMonitor",
    section: "Coating Materials",
    title: "Planar Field Monitor",
    short: "Samples planar E/H-derived quantities through the coating stack. It is not a volumetric 3D field monitor.",
    physicalMeaning: "Shows relative electric intensity and flux changes through film depth.",
    limitations: ["No full 3D field volume is solved."]
  },
  {
    id: "search.beamWidth",
    section: "Search And Robustness",
    title: "Beam Width",
    short: "Number of coating candidates retained at each search step. Larger beams explore more candidates but cost more evaluations.",
    physicalMeaning: "Search algorithm setting, not optical beam diameter.",
    limitations: ["This is deterministic bounded search, not adjoint or topology optimization."]
  },
  {
    id: "search.objectiveWeights",
    section: "Search And Robustness",
    title: "Objective Weights",
    short: "Scalar weights that rank reflectance, transmittance, absorbance, and constraints for coating candidates.",
    limitations: ["Objective scores are design heuristics, not certified manufacturing outcomes."]
  },
  {
    id: "robust.independentThickness",
    section: "Search And Robustness",
    title: "Independent Thickness",
    short: "Each layer thickness is perturbed independently for deterministic robust-yield checks.",
    limitations: ["Material n/k uncertainty is held fixed."]
  },
  {
    id: "robust.sharedDepositionScale",
    section: "Search And Robustness",
    title: "Shared Deposition Scale",
    short: "A correlated drift model where all layer thicknesses scale together, representing shared deposition calibration error.",
    limitations: ["This is a deterministic drift model, not Monte Carlo certification."]
  },
  {
    id: "robust.sharedOffsetResidual",
    section: "Search And Robustness",
    title: "Shared Offset + Residual",
    short: "Combines a shared thickness offset with per-layer residual drift to expose correlated manufacturing sensitivity.",
    limitations: ["No thermal, stress, roughness, or metrology calibration model."]
  },
  {
    id: "robust.sampleReduction",
    section: "Search And Robustness",
    title: "Sample Cap / Reduction",
    short: "Limits robust-search sample count when a full deterministic grid would be too large.",
    underTheHood: "The receipt records generated samples versus theoretical samples so reviewers can see when reduction occurred.",
    snippet: "if fullGridSamples > maxSamples:\n  use deterministic reduced sample set\n  record sampleReduction receipt"
  },
  {
    id: "robust.expectedScore",
    section: "Search And Robustness",
    title: "Expected Score",
    short: "Average robust score across deterministic perturbation samples.",
    limitations: ["Deterministic average over selected samples, not a statistical guarantee."]
  },
  {
    id: "robust.p90Score",
    section: "Search And Robustness",
    title: "P90 Robust Score",
    short: "A bad-but-plausible score under deterministic thickness perturbations. Lower p90 score means the stack is less fragile to manufacturing drift.",
    physicalMeaning: "Ranks candidates by tail performance rather than only nominal performance.",
    limitations: ["Not Monte Carlo confidence and not a manufacturing yield certificate."]
  },
  {
    id: "robust.worstCaseScore",
    section: "Search And Robustness",
    title: "Worst-Case Score",
    short: "Worst deterministic perturbation score observed for a robust candidate.",
    limitations: ["Only covers the configured perturbation model and sample set."]
  },
  {
    id: "robust.passRate",
    section: "Search And Robustness",
    title: "Pass Rate",
    short: "Fraction of deterministic perturbation samples meeting the optional pass-score threshold.",
    limitations: ["Not a certified manufacturing yield claim."]
  },
  {
    id: "exports.searchJson",
    section: "Exports",
    title: "Search JSON",
    short: "Exports ranked coating candidates, metrics, material receipts, and limitation language.",
    limitations: ["Exported search results remain planar TMM design evidence only."]
  },
  {
    id: "exports.robustSearchJson",
    section: "Exports",
    title: "Robust Search JSON",
    short: "Exports robust candidate ranking, perturbation receipts, sample reduction evidence, and material fixed-assumption notes.",
    limitations: ["No material uncertainty, Monte Carlo certification, or digital twin claim."]
  },
  {
    id: "exports.fdtdScaffold",
    section: "Exports",
    title: "FDTD Scaffold Export",
    short: "Exports a future-backend manifest and script skeleton. It does not execute a 3D FDTD solve.",
    limitations: ["Scaffold/export only; no in-app FDTD solver."]
  }
] satisfies ExplainEntry[];

export type ExplainEntryId = (typeof explainEntries)[number]["id"];

export function explainEntry(id: ExplainEntryId): ExplainEntry {
  const entry = explainEntries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing explainability entry: ${id}`);
  return entry;
}

export function groupedExplainEntries(entries: ExplainEntry[] = explainEntries): Array<{ section: ExplainEntry["section"]; entries: ExplainEntry[] }> {
  const sections = Array.from(new Set(entries.map((entry) => entry.section)));
  return sections.map((section) => ({ section, entries: entries.filter((entry) => entry.section === section) }));
}

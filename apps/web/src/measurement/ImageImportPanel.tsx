import { useRef, useState } from "react";
import {
  createMeasuredImage2D,
  grayscaleMeasuredPixels2D,
  measuredImageHistogram2D,
  type MeasuredImageHistogram2D,
  type MeasuredImagePixels2D,
  type MeasurementRoi2D,
  type Scene
} from "@emmicro/core";

export function ImageImportPanel({ scene, updateScene }: { scene: Scene; updateScene: (updater: (current: Scene) => Scene) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [histogram, setHistogram] = useState<MeasuredImageHistogram2D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const image = scene.measuredImages2D[0];

  async function importFile(file: File): Promise<void> {
    setError(null);
    try {
      const decoded = await decodeImageFile(file);
      const measured = createMeasuredImage2D({
        id: `measured-${Date.now().toString(36)}`,
        label: file.name.replace(/\.[^.]+$/, "") || "Measured image",
        pixels: decoded.pixels,
        importedAtIso: new Date().toISOString(),
        pixelDataPolicy: "embedded-data-url",
        previewDataUrl: decoded.dataUrl,
        calibration: {
          wavelengthM: scene.environment.defaultWavelengthM
        }
      });
      setHistogram(measuredImageHistogram2D(decoded.pixels));
      updateScene((current) => ({
        ...current,
        measuredImages2D: [measured, ...current.measuredImages2D]
      }));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : String(importError));
    }
  }

  return (
    <section className="analysis-panel">
      <div className="panel-heading">
        <h3>Measured Import</h3>
        <div className="compact-actions">
          <button type="button" onClick={importSyntheticFixture}>
            Fixture
          </button>
          <button type="button" onClick={() => inputRef.current?.click()}>
            Import
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        className="hidden-file"
        type="file"
        accept="image/png,image/jpeg"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void importFile(file);
          event.currentTarget.value = "";
        }}
      />
      {image ? (
        <>
          {image.previewDataUrl && <img className="measured-preview" src={image.previewDataUrl} alt={image.label} />}
          <div className="analysis-grid">
            <Metric label="Image" value={image.label} />
            <Metric label="Pixels" value={`${image.widthPx} x ${image.heightPx}`} />
            <Metric label="Hash" value={image.imageHash.slice(0, 10)} />
            <Metric label="Policy" value={image.pixelDataPolicy} />
          </div>
          {histogram && <HistogramStrip histogram={histogram} />}
          <p className="provenance-note">PNG/JPEG is decoded in the browser and passed to core as normalized grayscale Float32 pixels.</p>
        </>
      ) : (
        <div className="empty-state">Import a PNG or JPEG target image to start L3.4 measured-data calibration.</div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </section>
  );

  function importSyntheticFixture(): void {
    const pixels = makeSyntheticLinePairPixels(96, 64, 12);
    const id = `fixture-${Date.now().toString(36)}`;
    const measured = createMeasuredImage2D({
      id,
      label: "Synthetic line-pair fixture",
      pixels,
      importedAtIso: new Date().toISOString(),
      pixelDataPolicy: "embedded-data-url",
      previewDataUrl: renderGrayscalePreviewDataUrl(pixels),
      source: "synthetic-fixture",
      calibration: {
        pixelSizeUM: 0.5,
        pixelSizeVM: 0.5,
        magnification: 10,
        wavelengthM: scene.environment.defaultWavelengthM,
        objectiveNA: 0.02,
        sourceNA: 0.0025,
        exposureS: 0.01,
        bitDepth: 12,
        notes: "Synthetic L3.4 fixture metadata"
      }
    });
    const roi: MeasurementRoi2D = {
      id: `${id}-roi`,
      imageId: measured.id,
      label: "Line-pair ROI",
      type: "linePairs",
      xPx: 12,
      yPx: 8,
      widthPx: 72,
      heightPx: 48,
      rotationRad: 0
    };
    setHistogram(measuredImageHistogram2D(pixels));
    updateScene((current) => ({
      ...current,
      measuredImages2D: [measured, ...current.measuredImages2D],
      measurementRois2D: [roi, ...current.measurementRois2D]
    }));
  }
}

function HistogramStrip({ histogram }: { histogram: MeasuredImageHistogram2D }) {
  const maxBin = Math.max(1, ...histogram.bins);
  return (
    <div className="histogram-strip" aria-label="Measured image histogram">
      {histogram.bins.map((bin, index) => (
        <span key={index} style={{ height: `${Math.max(2, (bin / maxBin) * 34)}px` }} />
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function makeSyntheticLinePairPixels(widthPx: number, heightPx: number, periodPx: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const bright = Math.floor(x / (periodPx / 2)) % 2 === 0;
      const envelope = 0.94 - 0.18 * (y / Math.max(1, heightPx - 1));
      values[y * widthPx + x] = bright ? envelope : 0.16;
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}

function renderGrayscalePreviewDataUrl(pixels: MeasuredImagePixels2D): string {
  const canvas = document.createElement("canvas");
  canvas.width = pixels.widthPx;
  canvas.height = pixels.heightPx;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const imageData = context.createImageData(pixels.widthPx, pixels.heightPx);
  for (let pixelIndex = 0; pixelIndex < pixels.widthPx * pixels.heightPx; pixelIndex += 1) {
    const sample = Math.round(Math.min(1, Math.max(0, pixels.data[pixelIndex] ?? 0)) * 255);
    const offset = pixelIndex * 4;
    imageData.data[offset] = sample;
    imageData.data[offset + 1] = sample;
    imageData.data[offset + 2] = sample;
    imageData.data[offset + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

async function decodeImageFile(file: File): Promise<{ pixels: MeasuredImagePixels2D; dataUrl: string }> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadHtmlImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not create 2D canvas context for image import");
  context.drawImage(image, 0, 0);
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height);
  const grayscale = new Float32Array(canvas.width * canvas.height);
  for (let index = 0; index < grayscale.length; index += 1) {
    const rgbaIndex = index * 4;
    grayscale[index] = ((rgba.data[rgbaIndex] ?? 0) * 0.2126 + (rgba.data[rgbaIndex + 1] ?? 0) * 0.7152 + (rgba.data[rgbaIndex + 2] ?? 0) * 0.0722) / 255;
  }
  return {
    dataUrl,
    pixels: {
      widthPx: canvas.width,
      heightPx: canvas.height,
      channels: "grayscale",
      data: grayscale
    }
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode PNG/JPEG image"));
    image.src = src;
  });
}

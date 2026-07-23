import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useTranslation } from "react-i18next";

type DetectedBarcode = { rawValue?: string };

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

type WindowWithBarcodeDetector = Window &
  typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor };

type QrScannerSupport = "checking" | "supported" | "unsupported";

export function useFestivalCodeUnlock(
  onUnlock: (code: string) => Promise<boolean>,
) {
  const { t } = useTranslation();
  const [festivalCode, setFestivalCode] = useState("");
  const [festivalCodeError, setFestivalCodeError] = useState("");
  const [isSubmittingFestivalCode, setIsSubmittingFestivalCode] =
    useState(false);
  const [qrScannerSupport, setQrScannerSupport] =
    useState<QrScannerSupport>("checking");
  const [isScanningQrCode, setIsScanningQrCode] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanAnimationFrameRef = useRef<number | null>(null);
  const isScanningQrCodeRef = useRef(false);

  const stopQrScanner = useCallback(() => {
    isScanningQrCodeRef.current = false;
    setIsScanningQrCode(false);
    cancelPendingScan(scanAnimationFrameRef);
    stopCameraStream(cameraStreamRef);
    detachCameraVideo(videoRef);
  }, []);

  useQrScannerSupport(setQrScannerSupport, stopQrScanner);

  async function unlockFestivalCode(code: string, invalidMessage: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setFestivalCodeError(invalidMessage);
      return false;
    }

    setFestivalCodeError("");
    setIsSubmittingFestivalCode(true);
    try {
      if (!(await onUnlock(normalizedCode))) {
        setFestivalCodeError(invalidMessage);
        return false;
      }
      setFestivalCode("");
      return true;
    } catch {
      setFestivalCodeError(t("festivalAccess.errors.verify"));
      return false;
    } finally {
      setIsSubmittingFestivalCode(false);
    }
  }

  async function submitFestivalCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await unlockFestivalCode(
      festivalCode,
      t("festivalAccess.errors.invalidCode"),
    );
  }

  async function unlockScannedFestivalCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    setFestivalCode(normalizedCode);
    stopQrScanner();
    await unlockFestivalCode(
      normalizedCode,
      t("festivalAccess.qr.errors.invalidCode"),
    );
  }

  async function startQrScanner() {
    const BarcodeDetector = getSupportedBarcodeDetector(qrScannerSupport);
    if (!BarcodeDetector) {
      setFestivalCodeError(t("festivalAccess.qr.errors.unsupported"));
      return;
    }

    setFestivalCodeError("");
    setIsScanningQrCode(true);
    isScanningQrCodeRef.current = true;
    try {
      const stream = await requestCameraStream();
      const video = videoRef.current;
      if (!video) {
        stopStream(stream);
        setFestivalCodeError(t("festivalAccess.qr.errors.camera"));
        setIsScanningQrCode(false);
        isScanningQrCodeRef.current = false;
        return;
      }

      cameraStreamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      scheduleBarcodeScan(
        new BarcodeDetector({ formats: ["qr_code"] }),
        videoRef,
        isScanningQrCodeRef,
        scanAnimationFrameRef,
        unlockScannedFestivalCode,
        () => {
          setFestivalCodeError(t("festivalAccess.qr.errors.scan"));
          stopQrScanner();
        },
      );
    } catch {
      setFestivalCodeError(t("festivalAccess.qr.errors.camera"));
      stopQrScanner();
    }
  }

  function changeFestivalCode(value: string) {
    setFestivalCode(value);
    setFestivalCodeError("");
  }

  return {
    festivalCode,
    festivalCodeError,
    isSubmittingFestivalCode,
    qrScannerSupport,
    isScanningQrCode,
    videoRef,
    changeFestivalCode,
    submitFestivalCode,
    startQrScanner,
    stopQrScanner,
  };
}

function useQrScannerSupport(
  setSupport: (support: QrScannerSupport) => void,
  stopQrScanner: () => void,
) {
  useEffect(() => {
    let isCurrent = true;
    void detectQrScannerSupport().then((support) => {
      if (isCurrent) setSupport(support);
    });
    return () => {
      isCurrent = false;
      stopQrScanner();
    };
  }, [setSupport, stopQrScanner]);
}

async function detectQrScannerSupport(): Promise<QrScannerSupport> {
  const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
  if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const formats = BarcodeDetector.getSupportedFormats
      ? await BarcodeDetector.getSupportedFormats()
      : ["qr_code"];
    return formats.includes("qr_code") ? "supported" : "unsupported";
  } catch {
    return "unsupported";
  }
}

function getSupportedBarcodeDetector(support: QrScannerSupport) {
  const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
  if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) return undefined;
  return support === "supported" ? BarcodeDetector : undefined;
}

function requestCameraStream() {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });
}

function scheduleBarcodeScan(
  detector: BarcodeDetectorInstance,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  scanningRef: React.RefObject<boolean>,
  animationFrameRef: React.RefObject<number | null>,
  onCode: (code: string) => Promise<void>,
  onError: () => void,
) {
  async function scanFrame() {
    if (!scanningRef.current || !videoRef.current) return;
    try {
      const barcodes = await detector.detect(videoRef.current);
      const code = barcodes.find((barcode) => barcode.rawValue?.trim())?.rawValue;
      if (code) {
        await onCode(code);
        return;
      }
      animationFrameRef.current = window.requestAnimationFrame(() => {
        void scanFrame();
      });
    } catch {
      onError();
    }
  }
  animationFrameRef.current = window.requestAnimationFrame(() => {
    void scanFrame();
  });
}

function cancelPendingScan(ref: React.RefObject<number | null>) {
  if (ref.current === null) return;
  window.cancelAnimationFrame(ref.current);
  ref.current = null;
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function stopCameraStream(ref: React.RefObject<MediaStream | null>) {
  if (ref.current) stopStream(ref.current);
  ref.current = null;
}

function detachCameraVideo(ref: React.RefObject<HTMLVideoElement | null>) {
  if (ref.current) ref.current.srcObject = null;
}

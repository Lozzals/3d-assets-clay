import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLB_BASE } from "@/data/assets";

interface Props {
  file: string;
  enabled: boolean;
}

// ---- shared loader, cache, and concurrency limiter ----
const sharedLoader = new GLTFLoader();
const gltfCache = new Map<string, Promise<THREE.Group>>();
const thumbCache = new Map<string, Promise<string>>();

const MAX_CONCURRENT = 6;

// ---- persistent thumbnail cache (IndexedDB) ----
const IDB_NAME = "glb-thumbs";
const IDB_STORE = "thumbs";
let idbPromise: Promise<IDBDatabase | null> | null = null;
const openIdb = (): Promise<IDBDatabase | null> => {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbPromise;
};
const idbGet = async (key: string): Promise<string | null> => {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};
const idbSet = async (key: string, val: string): Promise<void> => {
  const db = await openIdb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(val, key);
  } catch {
    /* ignore */
  }
};

let active = 0;
const queue: Array<() => void> = [];
const runNext = () => {
  if (active >= MAX_CONCURRENT) return;
  const job = queue.shift();
  if (!job) return;
  active++;
  job();
};
const schedule = <T,>(job: () => Promise<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    queue.push(() => {
      job()
        .then(resolve, reject)
        .finally(() => {
          active--;
          runNext();
        });
    });
    runNext();
  });

const loadGlb = (file: string): Promise<THREE.Group> => {
  let p = gltfCache.get(file);
  if (p) return p;
  p = new Promise<THREE.Group>((resolve, reject) => {
    sharedLoader.load(
      `${GLB_BASE}${file}`,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err)
    );
  });
  gltfCache.set(file, p);
  return p;
};

// ---- one shared offscreen renderer for thumbnails ----
const THUMB_SIZE = 192;
let thumbRenderer: THREE.WebGLRenderer | null = null;
const getThumbRenderer = () => {
  if (thumbRenderer) return thumbRenderer;
  thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  thumbRenderer.setPixelRatio(1);
  thumbRenderer.setSize(THUMB_SIZE, THUMB_SIZE);
  thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
  return thumbRenderer;
};

const renderThumb = async (file: string): Promise<string> => {
  const source = await loadGlb(file);
  const obj = source.clone(true);

  const rawBox = new THREE.Box3().setFromObject(obj);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
  obj.scale.setScalar(1.6 / maxDim);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  obj.position.sub(center);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dl = new THREE.DirectionalLight(0xffffff, 0.65);
  dl.position.set(3, 5, 3);
  scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
  dl2.position.set(-3, 2, -3);
  scene.add(dl2);
  scene.add(obj);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  const fov = (camera.fov * Math.PI) / 180;
  const maxFitDim = Math.max(size.x, size.y, size.z);
  const distance = (maxFitDim / (2 * Math.tan(fov / 2))) * 1.35;
  camera.position.copy(new THREE.Vector3(1, 0.7, 1.4).normalize().multiplyScalar(distance));
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const r = getThumbRenderer();
  r.render(scene, camera);
  const url = r.domElement.toDataURL("image/webp", 0.85);

  // dispose this scene's clones (geometries are shared with cache, skip)
  return url;
};

const getThumb = (file: string): Promise<string> => {
  let p = thumbCache.get(file);
  if (p) return p;
  p = (async () => {
    const key = `v2:${file}`;
    const cached = await idbGet(key);
    // Guard against previously cached blank/broken thumbnails
    if (cached && cached.length > 2000) return cached;
    const url = await schedule(() => renderThumb(file));
    if (url && url.length > 2000) idbSet(key, url);
    return url;
  })().catch((e) => {
    thumbCache.delete(file);
    throw e;
  });
  thumbCache.set(file, p);
  return p;
};

export const GlbPreview = ({ file, enabled }: Props) => {
  const [thumb, setThumb] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus("loading");
    getThumb(file)
      .then((url) => {
        if (cancelled) return;
        setThumb(url);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [enabled, file]);

  return (
    <div
      className="absolute inset-0 cursor-pointer"
      onMouseEnter={() => status === "ready" && setInteractive(true)}
      onMouseLeave={() => setInteractive(false)}
    >
      {thumb && !interactive && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ imageRendering: "auto" }}
        />
      )}
      {interactive && <LiveView file={file} />}
      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-[10px] text-muted-foreground">
          {status === "error" ? (
            <span>preview unavailable</span>
          ) : (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-accent" />
              <span>loading 3D…</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ---- live interactive view (only on hover) ----
const LiveView = ({ file }: { file: string }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    let renderer: THREE.WebGLRenderer;
    let frameId = 0;
    let disposed = false;
    let controls: OrbitControls | null = null;
    const scene = new THREE.Scene();
    const w = mount.clientWidth || 240;
    const h = mount.clientHeight || 240;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
    } catch {
      return;
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 0.65);
    dl.position.set(3, 5, 3);
    scene.add(dl);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    let pivot: THREE.Object3D | null = null;
    const clock = new THREE.Clock();

    loadGlb(file).then((src) => {
      if (disposed) return;
      const obj = src.clone(true);
      const rawBox = new THREE.Box3().setFromObject(obj);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
      obj.scale.setScalar(1.6 / maxDim);
      obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      obj.position.sub(center);
      pivot = new THREE.Object3D();
      pivot.add(obj);
      scene.add(pivot);
      const fov = (camera.fov * Math.PI) / 180;
      const maxFitDim = Math.max(size.x, size.y, size.z);
      const distance = (maxFitDim / (2 * Math.tan(fov / 2))) * 1.35;
      camera.position.copy(new THREE.Vector3(1, 0.7, 1.4).normalize().multiplyScalar(distance));
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      controls!.target.set(0, 0, 0);
      controls!.update();
    });

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (pivot) pivot.rotation.y += dt * 0.4;
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      controls?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [file]);

  return <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />;
};

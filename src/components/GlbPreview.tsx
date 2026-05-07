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

const MAX_CONCURRENT = 4;
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
  p = schedule(
    () =>
      new Promise<THREE.Group>((resolve, reject) => {
        sharedLoader.load(
          `${GLB_BASE}${file}`,
          (gltf) => resolve(gltf.scene),
          undefined,
          (err) => reject(err)
        );
      })
  );
  gltfCache.set(file, p);
  return p;
};

export const GlbPreview = ({ file, enabled }: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    const mount = mountRef.current;
    setStatus("loading");

    let renderer: THREE.WebGLRenderer;
    let frameId = 0;
    let visible = true;
    let disposed = false;
    let controls: OrbitControls | null = null;
    const scene = new THREE.Scene();
    const w = mount.clientWidth || 240;
    const h = mount.clientHeight || 240;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(2, 1.5, 3);
    camera.lookAt(0, 0, 0);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
    } catch {
      setStatus("error");
      return;
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 0.65);
    dl.position.set(3, 5, 3);
    scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dl2.position.set(-3, 2, -3);
    scene.add(dl2);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();
    let pivot: THREE.Object3D | null = null;

    loadGlb(file)
      .then((sourceScene) => {
        if (disposed) return;
        const obj = sourceScene.clone(true);

        // First measure raw bounds and normalize scale to ~1.6 units
        const rawBox = new THREE.Box3().setFromObject(obj);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
        const scale = 1.6 / maxDim;
        obj.scale.setScalar(scale);

        // Re-measure AFTER scaling, then center the object on origin
        obj.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        obj.position.sub(center);

        pivot = new THREE.Object3D();
        pivot.add(obj);
        scene.add(pivot);

        // Fit camera to the centered, scaled bounds
        const fitOffset = 1.35;
        const maxFitDim = Math.max(size.x, size.y, size.z);
        const fov = (camera.fov * Math.PI) / 180;
        const distance = (maxFitDim / (2 * Math.tan(fov / 2))) * fitOffset;
        const dir = new THREE.Vector3(1, 0.7, 1.4).normalize();
        camera.position.copy(dir.multiplyScalar(distance));
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.minDistance = distance * 0.3;
          controls.maxDistance = distance * 5;
          controls.update();
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;
      const dt = clock.getDelta();
      if (mixer) mixer.update(dt);
      if (pivot) pivot.rotation.y += dt * 0.4;
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      if (!nw || !nh) return;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // Pause rendering when card scrolls off-screen
    const vio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible) clock.getDelta(); // reset delta to avoid jump
        }
      },
      { rootMargin: "100px" }
    );
    vio.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      vio.disconnect();
      controls?.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        // Don't dispose geometry/material — they're shared with the cached source scene
        void mesh;
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [enabled, file]);

  return (
    <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing">
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
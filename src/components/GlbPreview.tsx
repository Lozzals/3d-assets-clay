import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLB_BASE } from "@/data/assets";

interface Props {
  file: string;
  enabled: boolean;
}

export const GlbPreview = ({ file, enabled }: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    const mount = mountRef.current;
    setStatus("loading");

    let renderer: THREE.WebGLRenderer;
    let frameId = 0;
    let controls: OrbitControls | null = null;
    const scene = new THREE.Scene();
    const w = mount.clientWidth || 240;
    const h = mount.clientHeight || 240;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(2, 1.5, 3);
    camera.lookAt(0, 0, 0);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    const loader = new GLTFLoader();
    loader.load(
      `${GLB_BASE}${file}`,
      (gltf) => {
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 1.6 / maxDim;
        obj.scale.setScalar(scale);
        pivot = new THREE.Object3D();
        pivot.add(obj);
        scene.add(pivot);

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(obj);
          mixer.clipAction(gltf.animations[0]).play();
        }
        setStatus("ready");
      },
      undefined,
      () => setStatus("error")
    );

    const animate = () => {
      frameId = requestAnimationFrame(animate);
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

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls?.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else if (m) m.dispose();
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
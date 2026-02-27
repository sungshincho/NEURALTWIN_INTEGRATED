import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface Model3DPreviewProps {
  modelUrl: string;
  className?: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function Model3DPreview({ modelUrl, className = '' }: Model3DPreviewProps) {
  return (
    <div className={`relative bg-muted rounded-lg overflow-hidden ${className}`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 3, 3]} />
        <Suspense fallback={null}>
          <Model url={modelUrl} />
          <Environment preset="sunset" />
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={false}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <Suspense fallback={
          <div className="flex items-center gap-2 text-muted-foreground bg-background/80 px-4 py-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading 3D model...</span>
          </div>
        }>
          <div />
        </Suspense>
      </div>
    </div>
  );
}

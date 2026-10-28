import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const StudioEnvironment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene, invalidate } = useThree();

  useLayoutEffect(() => {
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = intensity;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
    };
  }, [gl, scene, invalidate, intensity]);

  return null;
};

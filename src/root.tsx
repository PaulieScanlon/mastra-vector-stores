import { Composition } from "remotion";
import { EmbeddingsFlight, embeddingsFlightSchema } from "./scenes/embeddings-flight";
import { LogoWall } from "./scenes/logo-wall";
import { Orbit, orbitSchema } from "./scenes/orbit";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LogoWall"
        component={LogoWall}
        defaultProps={{ mode: "full" as const }}
        durationInFrames={FPS * 14}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Orbit"
        component={Orbit}
        schema={orbitSchema}
        defaultProps={{ desaturateIcons: false }}
        durationInFrames={FPS * 9}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="EmbeddingsFlight"
        component={EmbeddingsFlight}
        schema={embeddingsFlightSchema}
        defaultProps={{ logoStyle: "full" as const, desaturateIcons: false }}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};

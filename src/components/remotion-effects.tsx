import { useThree } from "@react-three/fiber";
import { EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode, type EffectComposer as EffectComposerImpl } from "postprocessing";
import { useEffect, useRef } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

const RenderWhenReady: React.FC<{
  composer: React.RefObject<EffectComposerImpl | null>;
}> = ({ composer }) => {
  const { advance } = useThree();
  const frame = useCurrentFrame();

  useEffect(() => {
    const handle = delayRender(`Waiting for post-processing on frame ${frame}`);
    let request = 0;
    const renderIfReady = () => {
      if (composer.current && composer.current.passes.length > 1) {
        advance(performance.now());
        continueRender(handle);
        return;
      }
      request = requestAnimationFrame(renderIfReady);
    };
    request = requestAnimationFrame(renderIfReady);
    return () => {
      cancelAnimationFrame(request);
      continueRender(handle);
    };
  }, [frame, advance, composer]);

  return null;
};

export const RemotionEffects: React.FC<{ children: React.ReactElement | React.ReactElement[] }> = ({
  children,
}) => {
  const composer = useRef<EffectComposerImpl | null>(null);

  return (
    <>
      <EffectComposer ref={composer}>
        {children}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
      <RenderWhenReady composer={composer} />
    </>
  );
};

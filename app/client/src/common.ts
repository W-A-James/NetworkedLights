import type { Dispatch, SetStateAction } from 'react';

export type Setter<T> = Dispatch<SetStateAction<T>>

export interface StatusProps {
  power: boolean;
  animation: string;
  brightness: number;
  hue: number;
  breathingDelta: number;
  chasingHueWidth: number;
  chasingHueDelta: number;
  rainbowDelta: number;
};

export interface StatusControlProps extends StatusProps {
  setPower: Setter<StatusProps['power']>
  setAnimation: Setter<StatusProps['animation']>
  setBrightness: Setter<StatusControlProps['brightness']>
  setHue: Setter<StatusProps['hue']>
  setBreathingDelta: Setter<StatusProps['breathingDelta']>
  setChasingHueWidth: Setter<StatusProps['chasingHueWidth']>
  setChasingHueDelta: Setter<StatusProps['chasingHueDelta']>
  setRainbowDelta: Setter<StatusProps['rainbowDelta']>
}

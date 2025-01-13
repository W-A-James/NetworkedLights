import { useState } from 'react';
import { Setter, StatusControlProps } from '../common';

function InputGroup(props: { children: any; }) {
  return (
    <>
      {props.children}
    </>
  );
}

function NumericAndRangeInput({ label, value, min, max, bgColour, setValue }: { label: string, value?: number, min?: number, max?: number, bgColour?: string, setValue: Setter<number> }) {

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(e.target?.value);

    if (newValue !== value)
      setValue(Number(e.target?.value))
  }


  const numberInputName = `${label}-num`;
  if (bgColour) {
    return (
      <div className="input-group align-items-center">
        <label htmlFor="brightness" className="input-group-text" style={{ backgroundColor: bgColour }}>{label}</label>
        <input type="number" id={numberInputName} name={numberInputName} value={value} className="form-control form-number" onChange={handleChange} />
        <input type="range" id={label} name={label} min={min} max={max} value={value}
          className="form-control form-range" onChange={handleChange} />
      </div>
    );
  } else {
    return (
      <div className="input-group align-items-center">
        <label htmlFor="brightness" className="input-group-text">{label}</label>
        <input type="number" id={numberInputName} name={numberInputName} value={value} className="form-control form-number" onChange={handleChange} />
        <input type="range" id={label} name={label} min={min} max={max} value={value}
          className="form-control form-range" onChange={handleChange} />
      </div>
    );
  }
}

export function AnimationParameterControls({
  brightness,
  setBrightness,
  hue,
  setHue,
  breathingDelta,
  setBreathingDelta,
  chasingHueWidth,
  setChasingHueDelta,
  chasingHueDelta,
  setChasingHueWidth,
  rainbowDelta,
  setRainbowDelta
}: StatusControlProps) {
  const hueDegrees = (hue / 65535) * 360;
  const bgColor = `hsl(${Math.fround(hueDegrees)}deg 100% 50%)`;
  return (
    <div className="row">
      <InputGroup key="global">
        <NumericAndRangeInput label="Brightness" value={brightness} setValue={setBrightness} min={0} max={255} />
        <NumericAndRangeInput label="Hue" value={hue} bgColour={bgColor} setValue={setHue} min={0} max={65535} />
      </InputGroup>

      <InputGroup key="breathing">
        <NumericAndRangeInput label="Breathing delta" value={breathingDelta} setValue={setBreathingDelta} min={1} max={5} />
      </InputGroup>

      <InputGroup key="chasing">
        <NumericAndRangeInput label="Chasing hue width" value={chasingHueWidth} setValue={setChasingHueWidth} min={1} max={50} />
        <NumericAndRangeInput label="Chasing delta" value={chasingHueDelta} setValue={setChasingHueDelta} min={0} max={1000} />
      </InputGroup>

      <InputGroup key="rainbow">
        <NumericAndRangeInput label="Rainbow delta" value={rainbowDelta} setValue={setRainbowDelta} min={0} max={65535} />
      </InputGroup>
    </div>
  )
}
function Radio({ name, value, checked, animation, setAnimation }: { name: string, value: string, checked?: boolean, animation: string, setAnimation: Setter<string> }) {
  const [isChecked, setIsChecked] = useState(checked);
  function handleChange(_e: React.MouseEvent<HTMLInputElement>) {
    setIsChecked(!isChecked);
    if (isChecked && animation !== value) setAnimation(value);
  }
  return (
    <>
      <input type='radio' id={value} name={name} value={value} defaultChecked={checked} className="form-check-input" onClick={handleChange} />
      <label htmlFor={value} className="form-label">{value}</label>
    </>
  );
}

export function AnimationRadios({ animation, setAnimation }: { animation: string, setAnimation: Setter<string> }) {
  return (
    <div className="row">
      <form>
        <div className="container">
          <Radio name="animation" value="rainbow" checked={animation === "rainbow"} animation={animation} setAnimation={setAnimation} />
          <Radio name="animation" value="breathing" checked={animation === "breathing"} animation={animation} setAnimation={setAnimation} />
          <Radio name="animation" value="chasing" animation={animation} checked={animation === "chasing"} setAnimation={setAnimation} />
          <Radio name="animation" value="solid" checked={animation === "solid"} animation={animation} setAnimation={setAnimation} />
        </div>
      </form>
    </div>
  )
}

export default function Controls(props: StatusControlProps) {
  return (
    <>
      <AnimationRadios animation={props.animation} setAnimation={props.setAnimation} />
      <AnimationParameterControls
        power={props.power}
        setPower={props.setPower}

        animation={props.animation}
        setAnimation={props.setAnimation}

        brightness={props.brightness}
        setBrightness={props.setBrightness}

        hue={props.hue}
        setHue={props.setHue}

        breathingDelta={props.breathingDelta}
        setBreathingDelta={props.setBreathingDelta}

        chasingHueWidth={props.chasingHueWidth}
        setChasingHueWidth={props.setChasingHueWidth}

        chasingHueDelta={props.chasingHueDelta}
        setChasingHueDelta={props.setChasingHueDelta}

        rainbowDelta={props.rainbowDelta}
        setRainbowDelta={props.setRainbowDelta} />
    </>
  );
}

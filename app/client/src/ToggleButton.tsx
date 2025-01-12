import { sendCommand } from './api';
import { Setter } from './common';
export default function ToggleButton({ power, brightness, hue, setPower }: { power: boolean, brightness: number, hue: number, setPower: Setter<boolean> }) {
  return (
    <button id="toggle" className="btn btn-primary rounded-pill px-3" data-state="on"
      onClick={async function(e) {
        e.preventDefault();
        setPower(!power);

        if (power) {
          // turn off
          await sendCommand({ op: "off", opts: { brightness, hue } });
        } else {
          // turn on
          await sendCommand({ op: "on", opts: { brightness, hue } });
        }

      }}>{power ? "On" : "Off"}</button>
  )
}

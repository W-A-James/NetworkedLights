import { useState, useEffect } from 'react';
import Header from "./components/Header";
import Status from "./components/Status";
import Controls from "./components/Controls";
import UpdateButton from "./components/UpdateButton";
import ToggleButton from "./components/ToggleButton";
import { pollMCUStatus } from './common';

import './App.css';

function App() {
  // This is the local state of the command that will be sent when the Update button is pressed
  /*
  const [command, setCommand] = useState({
    power: true,
    animation: 'solid',
    brightness: 0,
    hue: 0,
    breathingDelta: 0,
    chasingHueWidth: 0,
    chasingHueDelta: 0,
    commandRainbowDelta: 0
  });*/
  const [commandPower, setCommandPower] = useState(true)
  const [commandAnimation, setCommandAnimation] = useState('solid');
  const [commandBrightness, setCommandBrightness] = useState(255);
  const [commandHue, setCommandHue] = useState(0);
  const [commandBreathingDelta, setCommandBreathingDelta] = useState(1);
  const [commandChasingHueWidth, setCommandChasingHueWidth] = useState(20);
  const [commandChasingHueDelta, setCommandChasingHueDelta] = useState(100);
  const [commandRainbowDelta, setCommandRainbowDelta] = useState(100);

  // This is the actual state of the microcontroller that gets updated with data from the
  // API/Control server
  const [mcuState, setMCUState] = useState({
    power: true,
    animation: 'solid',
    brightness: 255,
    hue: 0,
    breathingDelta: 1,
    chasingHueWidth: 20,
    chasingHueDelta: 100,
    rainbowDelta: 100
  });
  useEffect(() => {
    const interval = setInterval(async () => {
      const value = await pollMCUStatus();
      if (value) {
        const brightness: number = value.brightness;
        const breathingDelta: number = value.bDelta;
        const animation: string = value.state.split('Off')[0];
        const hue: number = value.hue;
        const chasingHueWidth: number = value.cHueWidth;
        const chasingHueDelta: number = value.cHueDelta;
        const rainbowDelta: number = value.rDelta;
        const power: boolean = !value.state.endsWith('Off');

        setMCUState({
          power,
          animation,
          hue,
          brightness,
          breathingDelta,
          chasingHueWidth,
          chasingHueDelta,
          rainbowDelta,
        });
      }
    }, 250)

    return () => clearInterval(interval);
  }, [mcuState, setMCUState]);


  return (
    <div className="App">
      <Header title="Networked Lights Controller" />

      <Status
        mcuState={mcuState}
      />
      <Controls
        power={commandPower}
        setPower={setCommandPower}

        animation={commandAnimation}
        setAnimation={setCommandAnimation}

        brightness={commandBrightness}
        setBrightness={setCommandBrightness}

        hue={commandHue}
        setHue={setCommandHue}

        breathingDelta={commandBreathingDelta}
        setBreathingDelta={setCommandBreathingDelta}

        chasingHueWidth={commandChasingHueWidth}
        setChasingHueWidth={setCommandChasingHueWidth}

        chasingHueDelta={commandChasingHueDelta}
        setChasingHueDelta={setCommandChasingHueDelta}

        rainbowDelta={commandRainbowDelta}
        setRainbowDelta={setCommandRainbowDelta} />

      <UpdateButton
        name="Update"
        power={commandPower}
        animation={commandAnimation}
        brightness={commandBrightness}
        hue={commandHue}
        breathingDelta={commandBreathingDelta}
        chasingHueWidth={commandChasingHueWidth}
        chasingHueDelta={commandChasingHueDelta}
        rainbowDelta={commandRainbowDelta} />

      <ToggleButton power={commandPower} brightness={commandBrightness} hue={commandHue} setPower={setCommandPower} />

    </div>
  );
}

export default App;

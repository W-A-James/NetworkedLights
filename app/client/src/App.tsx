import { useState, useEffect } from 'react';
import './App.css';
import Header from "./Header";
import Status from "./Status";
import Controls from "./Controls";
import UpdateButton from "./UpdateButton";
import ToggleButton from "./ToggleButton";
import { pollMCUStatus } from './common';

function App() {
  // This is the local state of the command that will be sent when the Update button is pressed
  const [power, setPower] = useState(true)
  const [animation, setAnimation] = useState('solid');
  const [brightness, setBrightness] = useState(255);
  const [hue, setHue] = useState(0);
  const [breathingDelta, setBreathingDelta] = useState(1);
  const [chasingHueWidth, setChasingHueWidth] = useState(20);
  const [chasingHueDelta, setChasingHueDelta] = useState(100);
  const [rainbowDelta, setRainbowDelta] = useState(100);

  const [mcuState, setMCUState] = useState({});
  useEffect(() => {
    setInterval(async () => {
      const value = await pollMCUStatus();
      console.log(value);
      setMCUState(value);
    }, 250)
  }, [mcuState, setMCUState]);


  return (
    <div className="App">
      <Header title="Networked Lights Controller" />

      <Status
        power={power}
        animation={animation}
        brightness={brightness}
        hue={hue}
        breathingDelta={breathingDelta}
        chasingHueWidth={chasingHueWidth}
        chasingHueDelta={chasingHueDelta}
        rainbowDelta={rainbowDelta}
      />
      <Controls
        power={power}
        setPower={setPower}

        animation={animation}
        setAnimation={setAnimation}

        brightness={brightness}
        setBrightness={setBrightness}

        hue={hue}
        setHue={setHue}

        breathingDelta={breathingDelta}
        setBreathingDelta={setBreathingDelta}

        chasingHueWidth={chasingHueWidth}
        setChasingHueWidth={setChasingHueWidth}

        chasingHueDelta={chasingHueDelta}
        setChasingHueDelta={setChasingHueDelta}

        rainbowDelta={rainbowDelta}
        setRainbowDelta={setRainbowDelta} />

      <UpdateButton
        name="Update"

        power={power}
        setPower={setPower}

        animation={animation}
        setAnimation={setAnimation}

        brightness={brightness}
        setBrightness={setBrightness}

        hue={hue}
        setHue={setHue}

        breathingDelta={breathingDelta}
        setBreathingDelta={setBreathingDelta}

        chasingHueWidth={chasingHueWidth}
        setChasingHueWidth={setChasingHueWidth}

        chasingHueDelta={chasingHueDelta}
        setChasingHueDelta={setChasingHueDelta}

        rainbowDelta={rainbowDelta}
        setRainbowDelta={setRainbowDelta} />
      <ToggleButton power={power} brightness={brightness} hue={hue} setPower={setPower} />
    </div>
  );
}

export default App;

import { StatusProps } from '../common';
import { sendDataToMCU } from '../api'

export default function UpdateButton(props: { name: string } & StatusProps) {
  return <button id='submit' className="btn btn-primary rounded-pill px-3"
    onClick={async function(e) {
      e.preventDefault();
      await sendDataToMCU(props as StatusProps);

    }}>{props.name}</button>

}

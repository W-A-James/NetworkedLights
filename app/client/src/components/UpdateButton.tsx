import { StatusControlProps, StatusProps } from '../common';
import { sendDataToMCU } from '../api'

export default function UpdateButton(props: { name: string } & StatusControlProps) {
  return <button id='submit' className="btn btn-primary rounded-pill px-3"
    onClick={async function(e) {
      e.preventDefault();
      await sendDataToMCU(props as StatusProps);

    }}>{props.name}</button>

}

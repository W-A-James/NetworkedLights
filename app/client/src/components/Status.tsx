import { StatusProps } from '../common';

function StatusEntry({ name, className, value }: { name: string, className: string, value: any }) {
  return (
    <tr className={className} id={`${name}-status`}>
      <td className={className}>{name}</td>
      <td className={className}>{value}</td>
    </tr>
  );
}

export default function Status({ mcuState }: { mcuState: StatusProps }) {
  const { power, animation, brightness, hue, breathingDelta, chasingHueWidth, chasingHueDelta, rainbowDelta } = mcuState;
  return (
    <div id="status" className="row">
      <table className="table table-light table-hover">
        <tbody>
          <StatusEntry name="Power" className="table-light" value={power} />
          <StatusEntry name="Animation" className="table-light" value={animation} />
          <StatusEntry name="Brightness" className="table-light" value={brightness} />
          <StatusEntry name="Hue" className="table-light" value={hue} />
          <StatusEntry name="Breathing Delta" className="table-light" value={breathingDelta} />
          <StatusEntry name="Chasing Hue Width" className="table-light" value={chasingHueWidth} />
          <StatusEntry name="Chasing Hue Delta" className="table-light" value={chasingHueDelta} />
          <StatusEntry name="Rainbow Delta" className="table-light" value={rainbowDelta} />
        </tbody>
      </table>
    </div>
  );
}

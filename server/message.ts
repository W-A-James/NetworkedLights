export type Operation = 'chasing' | 'solid' | 'rainbow' | 'breathing' | 'on' | 'off';

const PacketSize: Record<Operation, number> = {
  chasing: 7,
  solid: 5,
  rainbow: 5,
  breathing: 6,
  on: 2,
  off: 2,
};

const OpCode: Record<Operation, number> = {
  on: 0,
  off: 1,
  chasing: 2,
  solid: 3,
  rainbow: 4,
  breathing: 5,
};

export type RainbowOptions = {
  delta: number; // 16 bit uint
  brightness: number; // 8 bit uint
};

export type ChasingOptions = {
  hueWidth: number; // 16 bit uint
  hueDelta: number; // 16 bit uint
  brightness: number; // 8 bit uint
};

export type BreathingOptions = {
  delta: number; // 8 bit uint
  hue: number; // 16 bit uint
  brightness: number; //8 bit uint
};

export type SolidOptions = {
  hue: number; // 16 bit uint
  brightness: number; // 8 bit uint
};

type Options = BreathingOptions | SolidOptions | ChasingOptions | RainbowOptions;

export class Message {
  size: number;
  op: Operation;
  private _buffer: Buffer;

  constructor(op: Operation, value: Options) {
    this.op = op;
    this._buffer = Buffer.alloc(PacketSize[op]);
    // Set packet size
    this._buffer[0] = PacketSize[op];
    // Set opcode
    this._buffer[1] = OpCode[op];
    switch (op) {
      case 'on':
      case 'off':
        break;
      case 'solid':
        // Confirmed that ESP32 uses LE byte ordering
        const solidOptions = value as SolidOptions;
        // bytes 2 and 3
        this._buffer.writeUInt16LE(solidOptions.hue, 2)
        // bytes 4 and 5
        this._buffer.writeUInt16LE(solidOptions.brightness, 2)
        break;
      case 'breathing':
        const breathingOptions = value as BreathingOptions;
        this._buffer.writeUint16LE(breathingOptions.hue, 2);
        this._buffer[4] = breathingOptions.delta;
        this._buffer[5] = breathingOptions.brightness;
        break;
      case 'chasing':
        const chasingOptions = value as ChasingOptions;
        const uint16ArrayView = new Uint16Array(this._buffer, 2);
        // bytes 2 and 3
        uint16ArrayView[0] = chasingOptions.hueWidth;
        // bytes 4 and 5
        uint16ArrayView[1] = chasingOptions.hueDelta;
        this._buffer[6] = chasingOptions.brightness;
        break;
      case 'rainbow':
        const rainbowOptions = value as RainbowOptions;
        this._buffer.writeUInt16LE(rainbowOptions.delta, 2);
        this._buffer[4] = rainbowOptions.brightness;
        break;
      default:
        throw new Error("invalid op code");
    }
  }

  get buffer(): Buffer {
    return this._buffer;
  }
}

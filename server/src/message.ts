export type Operation = 'chasing' | 'solid' | 'rainbow' | 'breathing' | 'on' | 'off' | 'status';

export type MCUState = 'rainbow' | 'rainbowOff' | 'breathing' | 'breathingOff' | 'chasing' | 'chasingOff' | 'solid' | 'solidOff';

const PacketSize: Record<Operation, number> = {
  chasing: 7,
  solid: 5,
  rainbow: 5,
  breathing: 6,
  on: 2,
  off: 2,
  status: 2
};

const OpCode: Record<Operation, number> = {
  on: 0,
  off: 1,
  chasing: 2,
  solid: 3,
  rainbow: 4,
  breathing: 5,
  status: 0xff
};

const StateCode: Record<MCUState | number, number | MCUState> = {
  rainbow: 0,
  rainbowOff: 1,
  breathing: 2,
  breathingOff: 3,
  chasing: 4,
  chasingOff: 5,
  solid: 6,
  solidOff: 7,
  0: 'rainbow',
  1: 'rainbowOff',
  2: 'breathing',
  3: 'breathingOff',
  4: 'chasing',
  5: 'chasingOff',
  6: 'solid',
  7: 'solidOff'
};

export interface RainbowOptions {
  delta: number // 16 bit uint
  brightness: number // 8 bit uint
}

export interface ChasingOptions {
  hueWidth: number // 16 bit uint
  hueDelta: number // 16 bit uint
  brightness: number // 8 bit uint
}

export interface BreathingOptions {
  delta: number // 8 bit uint
  hue: number // 16 bit uint
  brightness: number // 8 bit uint
}

export interface SolidOptions {
  hue: number // 16 bit uint
  brightness: number // 8 bit uint
}

type Options = BreathingOptions | SolidOptions | ChasingOptions | RainbowOptions;

export class CommandMessage {
  op: Operation;
  private readonly _buffer: Buffer;

  constructor (op: 'rainbow', value: RainbowOptions);
  constructor (op: 'chasing', value: ChasingOptions);
  constructor (op: 'breathing', value: BreathingOptions);
  constructor (op: 'solid', value: SolidOptions);
  constructor (op: 'on' | 'off' | 'status');
  constructor (op: 'rainbow' | 'chasing' | 'breathing' | 'solid' | 'on' | 'off' | 'status', options?: Options) {
    this.op = op;
    this._buffer = Buffer.alloc(PacketSize[op]);
    // Set packet size
    this._buffer[0] = PacketSize[op];
    // Set opcode
    this._buffer[1] = OpCode[op];
    let solidOptions: SolidOptions;
    let breathingOptions: BreathingOptions;
    let chasingOptions: ChasingOptions;
    let rainbowOptions: RainbowOptions;
    switch (op) {
      case 'on':
      case 'off':
      case 'status':
        break;
      case 'solid':
        // Confirmed that ESP32 uses LE byte ordering
        solidOptions = options as SolidOptions;
        // bytes 2 and 3
        this._buffer.writeUInt16LE(solidOptions.hue, 2)
        // byte 4
        this._buffer[4] = solidOptions.brightness;
        break;
      case 'breathing':
        breathingOptions = options as BreathingOptions;
        this._buffer.writeUint16LE(breathingOptions.hue, 2);
        this._buffer[4] = breathingOptions.delta;
        this._buffer[5] = breathingOptions.brightness;
        break;
      case 'chasing':
        chasingOptions = options as ChasingOptions;
        this._buffer.writeUint16LE(chasingOptions.hueWidth, 2);
        this._buffer.writeUint16LE(chasingOptions.hueDelta, 4);
        this._buffer[6] = chasingOptions.brightness;
        break;
      case 'rainbow':
        rainbowOptions = options as RainbowOptions;
        this._buffer.writeUInt16LE(rainbowOptions.delta, 2);
        this._buffer[4] = rainbowOptions.brightness;
        break;
      default:
        throw new Error('invalid op code');
    }
  }

  get buffer (): Buffer {
    return this._buffer;
  }
}

export interface StatusMessage {
  size: number // 8 bits
  hue: number // 16 bits
  rDelta: number // 16 bits
  cHueWidth: number // 16 bits
  cHueDelta: number // 16 bits
  bDelta: number // 8 bits
  state: string// 8 bits
  brightness: number // 8 bits
}

export class MCUStatusMessage {
  buffer: Buffer;

  constructor (buffer: Buffer) {
    this.buffer = buffer;
    if (this.buffer.length !== 12) throw new Error('Incorrectly formatted packet: Wrong length');
    if (this.buffer[0] !== 12) throw new Error('Malformed packet: Size should be first byte');
  }

  decode (): StatusMessage {
    const stateCode = this.buffer.readUint8(10);
    const state = StateCode[stateCode] as string;
    const status = {
      size: this.buffer.readUint8(0),
      hue: this.buffer.readUint16LE(1),
      rDelta: this.buffer.readUint16LE(3),
      cHueWidth: this.buffer.readUint16LE(5),
      cHueDelta: this.buffer.readUint16LE(7),
      bDelta: this.buffer.readUint8(9),
      state,
      brightness: this.buffer.readUint8(11)
    };

    if (status.size !== 12) throw new Error('Size should be 12 bytes');

    return status;
  }
}

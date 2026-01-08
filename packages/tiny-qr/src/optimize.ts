import { modeDataBitsCount, modeLengthBitsCount, modeMax } from './mode.ts';
import { Mode, type Version } from './types.ts';
import { versionModeBitsCount } from './version.ts';

/** A segment of data committed to an encoding mode */
export interface Segment {
  mode: Mode;
  begin: number;
  end: number;
}

/** Compute the number of bits when this segment is encoded */
function encodedLenSegment(segment: Segment, version: Version): number {
  const byteSize = segment.end - segment.begin;
  const charsCount = byteSize;

  const modeBitsCount = versionModeBitsCount(version);
  const lengthBitsCount = modeLengthBitsCount(segment.mode, version);
  const dataBitsCount = modeDataBitsCount(segment.mode, charsCount);

  return modeBitsCount + lengthBitsCount + dataBitsCount;
}

/** Character set classification for parsing */
enum ExclCharSet {
  End = 0,
  Symbol = 1,
  Numeric = 2,
  Alpha = 3,
  Byte = 4,
}

function fromU8(c: number): ExclCharSet {
  if (c === 0x20 || c === 0x24 || c === 0x25 || c === 0x2a || c === 0x2b || (c >= 0x2d && c <= 0x2f) || c === 0x3a) {
    return ExclCharSet.Symbol;
  }
  if (c >= 0x30 && c <= 0x39) return ExclCharSet.Numeric;
  if (c >= 0x41 && c <= 0x5a) return ExclCharSet.Alpha;
  return ExclCharSet.Byte;
}

/** Parser state */
enum State {
  Init = 0,
  Numeric = 5,
  Alpha = 10,
  Byte = 15,
}

/** Parser action */
enum Action {
  Idle,
  Numeric,
  Alpha,
  Byte,
}

const STATE_TRANSITION: Array<[State, Action]> = [
  // Init state:
  [State.Init, Action.Idle],     // End
  [State.Alpha, Action.Idle],    // Symbol
  [State.Numeric, Action.Idle],  // Numeric
  [State.Alpha, Action.Idle],    // Alpha
  [State.Byte, Action.Idle],     // Byte
  // Numeric state:
  [State.Init, Action.Numeric],   // End
  [State.Alpha, Action.Numeric],  // Symbol
  [State.Numeric, Action.Idle],   // Numeric
  [State.Alpha, Action.Numeric],  // Alpha
  [State.Byte, Action.Numeric],   // Byte
  // Alpha state:
  [State.Init, Action.Alpha],     // End
  [State.Alpha, Action.Idle],     // Symbol
  [State.Numeric, Action.Alpha],  // Numeric
  [State.Alpha, Action.Idle],     // Alpha
  [State.Byte, Action.Alpha],     // Byte
  // Byte state:
  [State.Init, Action.Byte],      // End
  [State.Alpha, Action.Byte],     // Symbol
  [State.Numeric, Action.Byte],   // Numeric
  [State.Alpha, Action.Byte],     // Alpha
  [State.Byte, Action.Idle],      // Byte
];

/** Parser state for classifying input into segments */
export interface ParserState {
  readonly data: Uint8Array;
  readonly index: number;
  readonly ended: boolean;
  readonly state: State;
  readonly begin: number;
}

/** Creates a new parser state */
export function createParser(data: Uint8Array): ParserState {
  return {
    data,
    index: 0,
    ended: false,
    state: State.Init,
    begin: 0,
  };
}

/** Advances the parser and returns the next segment and updated state */
export function parserNext(parser: ParserState): [Segment | null, ParserState] {
  let current = parser;

  while (true) {
    if (current.ended) return [null, current];

    const i = current.index;
    let ecs: ExclCharSet;
    let newEnded: boolean = current.ended;
    let newIndex: number = current.index;

    if (i >= current.data.length) {
      ecs = ExclCharSet.End;
      newEnded = true;
    } else {
      ecs = fromU8(current.data[i]!);
      newIndex++;
    }

    const [nextState, action] = STATE_TRANSITION[current.state + ecs]!;

    const oldBegin = current.begin;
    let pushMode: Mode;

    switch (action) {
      case Action.Idle:
        current = {
          ...current,
          index: newIndex,
          ended: newEnded,
          state: nextState,
        };
        continue;
      case Action.Numeric:
        pushMode = Mode.Numeric;
        break;
      case Action.Alpha:
        pushMode = Mode.Alphanumeric;
        break;
      case Action.Byte:
        pushMode = Mode.Byte;
        break;
    }

    const newState: ParserState = {
      ...current,
      index: newIndex,
      ended: newEnded,
      state: nextState,
      begin: i,
    };

    return [{ mode: pushMode, begin: oldBegin, end: i }, newState];
  }
}

/** Collect all segments from a parser */
export function parserCollect(parser: ParserState): Segment[] {
  const segments: Segment[] = [];
  let current = parser;

  while (true) {
    const [seg, newState] = parserNext(current);
    if (seg === null) break;
    segments.push(seg);
    current = newState;
  }

  return segments;
}

/** Optimizer state that combines adjacent segments when beneficial */
export interface OptimizerState {
  readonly parser: ParserState;
  readonly lastSegment: Segment | null;
  readonly lastSegmentSize: number;
  readonly version: Version;
  readonly ended: boolean;
}

/** Creates a new optimizer state */
export function createOptimizer(parser: ParserState, version: Version): OptimizerState {
  const [first, newParser] = parserNext(parser);

  if (first === null) {
    return {
      parser: newParser,
      lastSegment: null,
      lastSegmentSize: 0,
      version,
      ended: true,
    };
  }

  return {
    parser: newParser,
    lastSegment: first,
    lastSegmentSize: encodedLenSegment(first, version),
    version,
    ended: false,
  };
}

/** Advances the optimizer and returns the next optimized segment and updated state */
export function optimizerNext(optimizer: OptimizerState): [Segment | null, OptimizerState] {
  if (optimizer.ended) return [null, optimizer];

  let current = optimizer;

  while (true) {
    const [segment, newParser] = parserNext(current.parser);

    if (segment === null) {
      return [
        current.lastSegment,
        {
          ...current,
          parser: newParser,
          ended: true,
        },
      ];
    }

    const segSize = encodedLenSegment(segment, current.version);

    const newSegment: Segment = {
      mode: modeMax(current.lastSegment!.mode, segment.mode),
      begin: current.lastSegment!.begin,
      end: segment.end,
    };
    const newSize = encodedLenSegment(newSegment, current.version);

    if (current.lastSegmentSize + segSize >= newSize) {
      current = {
        ...current,
        parser: newParser,
        lastSegment: newSegment,
        lastSegmentSize: newSize,
      };
    } else {
      const oldSegment = current.lastSegment;
      return [
        oldSegment,
        {
          ...current,
          parser: newParser,
          lastSegment: segment,
          lastSegmentSize: segSize,
        },
      ];
    }
  }
}

/** Collect all optimized segments */
export function optimizerCollect(optimizer: OptimizerState): Segment[] {
  const segments: Segment[] = [];
  let current = optimizer;

  while (true) {
    const [seg, newState] = optimizerNext(current);
    if (seg === null) break;
    segments.push(seg);
    current = newState;
  }

  return segments;
}

/** Computes the total encoded length of all segments */
export function totalEncodedLen(segments: Segment[], version: Version): number {
  return segments.reduce((sum, seg) => sum + encodedLenSegment(seg, version), 0);
}

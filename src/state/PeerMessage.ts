// GGPort
import { Schema, type } from "@colyseus/schema";

export class Header extends Schema {
    @type("uint16")
    sequenceNumber = 0;
    @type("string")
    sessionId = ""; // Client session ID that receives
}

// Called by ColyseusPeer.SendSyncRequest
export class SyncRequest extends Header {
    @type("uint32")
    randomRequest = 0;
}

// ColyseusPeer.MsgType.SyncReply
export class SyncReply extends Header {
    @type("uint32")
    randomReply = 0;
}

export class Input extends Header {
    @type("int32")
    startFrame = 0;
    @type("boolean")
    disconnectRequested = false;
    @type("int32")
    ackFrame = 0;
    @type("uint16")
    numBits = 0;

    //private fixed bool _peerDisconnectedFlags[MAX_PLAYERS];
    //private fixed int _peerLastFrames[MAX_PLAYERS];
    //public fixed byte bits[MAX_COMPRESSED_BITS]; /* must be last */ // TODO why?
    @type("int64")
    input: number = 0;
}

export class QualityReport extends Header {
    @type("int8")
    frameAdvantage = 0; /* what's the other guy's frame advantage? */
    @type("int64")
    ping = 0;
}

export class QualityReply extends Header {
    @type("int64")
    pong = 0;
}

export class InputAck extends Header {
    // TODO address bitfields
    @type("int32")
    ackFrame = 0; //:31;
}

// Todo, remove since Colysues already have a pinging
export class KeepAlive extends Header {

}

export enum MsgType {
    Invalid = 0,
    SyncRequest = 1,
    SyncReply = 2,
    Input = 3,
    QualityReport = 4,
    QualityReply = 5,
    KeepAlive = 6,
    InputAck = 7
};

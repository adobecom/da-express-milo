import { UPLOAD_EVENTS } from "./consts";
import { UploadEventStatusPayload } from "./types";

/**
 * Event dispatched when an upload is complete
 * The event is dispatched on the window object
 * so that it can be listened to by anyone
 */
export class UploadStatusEvent extends CustomEvent<UploadEventStatusPayload> {
    static readonly EVENT_NAME = UPLOAD_EVENTS.UPLOAD_STATUS;
    constructor(payload: UploadEventStatusPayload) {
        super(UploadStatusEvent.EVENT_NAME, { bubbles: true, composed: true, detail: payload });
    }
}
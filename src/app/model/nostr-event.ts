import {Event} from "nostr-tools/lib/types/event";


export enum SubsKind {
  AUTHOR, MENTION
}

export interface NostrEvent {
  relayUrl: string
  event: Event
  subsKind: SubsKind
}

import {Event} from "nostr-tools/lib/types/event";


export enum SubsKind {
  EOSE, AUTHOR, MENTION, ZAP
}

export interface NostrEvent {
  relayUrl: string
  event: Event | undefined
  subsKind: SubsKind
}

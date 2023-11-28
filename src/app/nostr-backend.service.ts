import {Injectable} from '@angular/core';
import {relayInit} from 'nostr-tools'
import {Relay} from "nostr-tools/lib/types/relay";
import {ObservedProfiles} from "./model/observed-profiles"
import {Observer} from "rxjs";
import {NostrEvent, SubsKind} from "./model/nostr-event";

const INITIAL_DAYS: number = 3

@Injectable({
  providedIn: 'root'
})
export class NostrBackendService {

  relays: Relay[] = []
  knownEventIds: Set<string> = new Set()
  observes: Map<string, ObservedProfiles> = new Map();
  followers: Set<Observer<NostrEvent>> = new Set()

  constructor() {

    const ray = new ObservedProfiles("c47e92ddbb45f35ff8d821c37fdf211eb57179c1a36760b8d2638e6f5c577873",
      "https://image.nostr.build/fb289b3c01cf57f7baf473e8d0b6a35e7882123e04b03dd4a66a5d7ae164f64e.jpg",
      "raymon@nostrich.house", true, true, true)
    ray.alias = "ray"
    this.observes.set("c47e92ddbb45f35ff8d821c37fdf211eb57179c1a36760b8d2638e6f5c577873", ray)

    const sidd = new ObservedProfiles("5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414",
      "https://media.nostr.band/thumbs/5414/5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414-picture-192",
      "siddhartha@nostrich.house", true, true, true)
    sidd.display_color = "chocolate"
    sidd.alias = "siddharta"
    this.observes.set("5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414", sidd)
    // TODO: load observes from localstorage

    let relay_urls = [
      "wss://nostr.mom",
      "wss://nostr-pub.wellorder.net",
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.kiatsu.world",
      "wss://soloco.nl",
      "wss://relay.lacosanostr.com",
      "wss://nostrue.com",
      "wss://nostr.einundzwanzig.space",
      "wss://bitcoiner.social",
      "wss://relay.nostr.bg",
      "wss://nostr.orangepill.dev",
    ]
    // TODO: load relay_urls from localstorage

    relay_urls.forEach((u) => {
      let relay = relayInit(u)
      this.relays.push(relay)
      relay.on('connect', () => {
        console.debug(`connected to ${relay.url}`)
      })
      relay.on('disconnect', () => {
        console.debug(`disconnected from ${relay.url}`)
      })
      relay.on('error', () => {
        console.debug(`failed to connect to ${relay.url}`)
      })
      relay.connect().then(() => {
        this.subscribeAtRelay(relay, SubsKind.AUTHOR)
        this.subscribeAtRelay(relay, SubsKind.ZAP)
        this.subscribeAtRelay(relay, SubsKind.MENTION)
      })
    })
  }

  subscribeAtRelay(relay: Relay, kind: SubsKind) {
    let since = Math.floor(Date.now() / 1000) - (24 * INITIAL_DAYS * 3600)
    let npubs: string[] = []
    let filters: any[] = []
    switch (kind) {
      case SubsKind.AUTHOR:
        this.observes.forEach((o) => {
          if (o.watch_post) npubs.push(o.hex_pub)
        })
        filters = [
          {
            "authors": npubs,
            "kinds": [1],
            "since": since
          },
        ]
        break
      case SubsKind.MENTION:
        this.observes.forEach((o) => {
          if (o.watch_mentions) npubs.push(o.hex_pub)
        })
        filters = [
          {
            "#p": npubs,
            "kinds": [1],
            "since": since
          },
        ]
        break
      case SubsKind.ZAP:
        this.observes.forEach((o) => {
          if (o.watch_zaps) npubs.push(o.hex_pub)
        })
        filters = [
          {
            "#p": npubs,
            "kinds": [9735],
            "since": since
          },
          {
            "authors": npubs,
            "kinds": [9735],
            "since": since
          },
        ]
        break
    }
    if (npubs.length == 0) return
    console.log("subsing filter: " + JSON.stringify(filters))
    let sub = relay.sub(filters, {id: 'subs-' + kind})
    sub.on('event', event => {
      this.broadcastNewEvent(event, relay, kind);
    })
    sub.on('eose', () => {
      console.log("got EOSE - waiting now for realtime events")
      this.broadcastNewEvent(undefined, relay, SubsKind.EOSE)
    })
  }

  private broadcastNewEvent(event: any, relay: Relay, subsKind: SubsKind) {
    if (subsKind == SubsKind.EOSE) {
      this.followers.forEach((o) => o.next(
        {event: undefined, relayUrl: relay.url, subsKind: subsKind}
      ))
    }
    if (!this.knownEventIds.has(event.id)) {
      this.knownEventIds.add(event.id)
      // console.log('we got an event:', event)
      let ne: NostrEvent = {event: event, relayUrl: relay.url, subsKind: subsKind}
      this.followers.forEach((o) => o.next(ne))
    }
  }

  subscribeToEvents(observer: Observer<NostrEvent>) {
    console.log("Got new follower")
    this.followers.add(observer)
  }

  getObservedProfile(hexpub: string): ObservedProfiles {
    const x = this.observes.get(hexpub)
    if (x == undefined) {
      throw new RangeError()
    }
    return x
  }

  hasObservedProfile(hexpub: string) {
    return this.observes.has(hexpub)
  }

}

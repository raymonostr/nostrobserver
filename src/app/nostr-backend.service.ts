import {Injectable} from '@angular/core';
import {relayInit} from 'nostr-tools'
import {Relay} from "nostr-tools/lib/types/relay";
import {ObservedProfiles} from "./model/observed-profiles"
import {Observer} from "rxjs";
import {NostrEvent, SubsKind} from "./model/nostr-event";

const INITIAL_DAYS: number = 2

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
      "raymon@nostrich.house", true, true)
    ray.alias = "ray"
    this.observes.set("c47e92ddbb45f35ff8d821c37fdf211eb57179c1a36760b8d2638e6f5c577873", ray)

    const sidd = new ObservedProfiles("5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414",
      "https://media.nostr.band/thumbs/5414/5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414-picture-192",
      "siddhartha@nostrich.house", true, true)
    sidd.display_color = "chocolate"
    sidd.alias = "siddharta"
    this.observes.set("5c7d484b5dc652992510b358dba3ad0b5594ac668e26a053982d4a3ce1ba5414", sidd)
    // TODO: load observes from localstorage

    let relay_urls = ['wss://nos.lol', 'wss://relay.nostr.bg']
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
        this.subscribeAuthorAtRelay(relay)
        this.subscribeMentionAtRelay(relay)
      })
    })
  }

  subscribeMentionAtRelay(relay: Relay) {
    let mentions: string[] = []
    this.observes.forEach((o) => {
      if (o.watch_mentions) {
        mentions.push(o.hex_pub)
      }
    })
    console.log("subsing " + JSON.stringify(mentions))
    let sub = relay.sub([
      {
        "#p": mentions,
        "kinds": [1],
        "since": Math.floor(Date.now() / 1000) - (24 * INITIAL_DAYS * 3600)
      },
    ], {id: 'nob-mentions'})
    sub.on('event', event => {
      this.broadcastNewEvent(event, relay, SubsKind.MENTION);
    })
    sub.on('eose', () => {
      console.log("got EOSE - waiting now for realtime events")
    })
  }


  subscribeAuthorAtRelay(relay: Relay) {
    let authors: string[] = []
    this.observes.forEach((o) => {
      if (o.watch_post) {
        authors.push(o.hex_pub)
      }
    })
    console.log("subsing " + JSON.stringify(authors))
    let sub = relay.sub([
      {
        "authors": authors,
        "kinds": [1],
        "since": Math.floor(Date.now() / 1000) - (24 * INITIAL_DAYS * 3600)
      },
    ], {id: 'nob-authors'})
    sub.on('event', event => {
      this.broadcastNewEvent(event, relay, SubsKind.AUTHOR);
    })
    sub.on('eose', () => {
      console.log("got EOSE - waiting now for realtime events")
    })
  }

  private broadcastNewEvent(event: any, relay: Relay, subsKind: SubsKind) {
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
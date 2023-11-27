import {Event} from "nostr-tools/lib/types/event";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class NostrHelper {

  getTags(event: Event): string[][] {
    return event.tags
  }

  countTag(event: Event, tag: string): number {
    let num: number = 0
    event.tags.forEach((t) => {
      if (t[0] == tag) num += 1
    })
    return num
  }

  getTag(event: Event, tag: string): string[][] {
    return event.tags.filter((t) => t[0] == tag)
  }

  getBolt11Section(sections: any[], name: string): any {
    return ((sections.filter((s) => s.name == name))[0])
  }
}

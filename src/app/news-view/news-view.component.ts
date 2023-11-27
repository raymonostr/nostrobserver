import {Component} from '@angular/core';
import {NostrBackendService} from "../nostr-backend.service";
import {Observer} from "rxjs";
import {NostrEvent, SubsKind} from "../model/nostr-event";
import {ObservedProfiles} from "../model/observed-profiles";
import {formatDate} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ProfileSelectorComponent} from "../profile-selector/profile-selector.component";

export interface Msg {
  content: string
  timestamp_unix: number
  timestamp_str: string
  observe: ObservedProfiles
  msgKind: SubsKind
}

@Component({
  selector: 'app-news-view',
  templateUrl: './news-view.component.html',
  styleUrls: ['./news-view.component.css']
})
export class NewsViewComponent {

  texts: Msg[] = []
  protected readonly SubsKind = SubsKind;

  follower: Observer<NostrEvent> = {
    'next': value => this.onEvent(value),
    'error': err => this.onError(err),
    'complete': () => this.onComplete()
  }

  constructor(private nostrBackendService: NostrBackendService, public modalDialog: MatDialog) {
    console.log("Follow my backend")
    nostrBackendService.subscribeToEvents(this.follower)
  }

  onEvent(event: NostrEvent) {
    console.log("got new text : " + event.event.content)
    const msg: Msg = {
      content: event.event.content,
      observe: ObservedProfiles.emptyObservedProfile(),
      timestamp_str: this.date_TO_String(new Date(1000 * event.event.created_at)),
      timestamp_unix: event.event.created_at,
      msgKind: event.subsKind
    }

    if (event.subsKind == SubsKind.AUTHOR) {
      const observe: ObservedProfiles = this.nostrBackendService.getObservedProfile(event.event.pubkey)
      msg.observe = observe
    } else {
      event.event.tags.forEach((tag) => {
        if (tag[0] == 'p') {
          if (this.nostrBackendService.hasObservedProfile(tag[1])) {
            msg.observe = this.nostrBackendService.getObservedProfile(tag[1])
          }
        }
      })

    }

    if ((this.texts.length == 0) || (this.texts[0].timestamp_unix < msg.timestamp_unix)) {
      this.texts.unshift(msg)
    } else {
      this.texts.push(msg)
    }

  }

  onProfilesButtonPress() {
    this.modalDialog.open(ProfileSelectorComponent)
  }

  private onError(err: any) {

  }

  private onComplete() {

  }

  date_TO_String(date_Object: Date) {
    return formatDate(date_Object, "MM/dd HH:mm", "en-US")

  }

}

import {Component} from '@angular/core';
import {NostrBackendService} from "../nostr-backend.service";
import {Observer} from "rxjs";
import {NostrEvent, SubsKind} from "../model/nostr-event";
import {ObservedProfiles} from "../model/observed-profiles";
import {formatDate} from "@angular/common";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ProfileSelectorComponent} from "../profile-selector/profile-selector.component";
import {NostrHelper} from "../nostr-helper";
import {decode} from "@gandlaf21/bolt11-decode"
import {Event} from "nostr-tools/lib/types/event";

export enum MsgKind {
  incoming, outgoing
}

export interface Msg {
  content: string
  timestamp_unix: number
  timestamp_str: string
  observe: ObservedProfiles
  msgKind: MsgKind
}

@Component({
  selector: 'app-news-view',
  templateUrl: './news-view.component.html',
  styleUrls: ['./news-view.component.css']
})
export class NewsViewComponent {

  texts: Msg[] = []

  follower: Observer<NostrEvent> = {
    'next': value => this.onEvent(value),
    'error': err => this.onError(err),
    'complete': () => this.onComplete()
  }

  constructor(private nostrBackendService: NostrBackendService, public modalDialog: MatDialog,
              private nostrHelper: NostrHelper) {
    console.log("Follow my backend")
    nostrBackendService.subscribeToEvents(this.follower)
  }

  onEvent(event: NostrEvent) {
    // resort on EOSE
    if (event.subsKind == SubsKind.EOSE) {
      console.log("sorting on EOSE")
      this.texts = this.texts.sort((a, b) => a.timestamp_unix < b.timestamp_unix ? 1 : -1)
      return
    }
    if (event.event == undefined) return;
    console.log("got new event kind " + event.event.kind + " text : " + event.event.content)
    const msg: Msg = {
      content: event.event.content,
      observe: ObservedProfiles.emptyObservedProfile(),
      timestamp_str: this.date_TO_String(new Date(1000 * event.event.created_at)),
      timestamp_unix: event.event.created_at,
      msgKind: MsgKind.outgoing
    }

    if (event.subsKind == SubsKind.AUTHOR) {
      const observe: ObservedProfiles = this.nostrBackendService.getObservedProfile(event.event.pubkey)
      msg.observe = observe
    } else if (event.subsKind == SubsKind.MENTION) {
      let p_tags = this.nostrHelper.getTag(event.event, 'p')
      msg.msgKind = MsgKind.incoming
      p_tags.forEach((tag) => {
        if (this.nostrBackendService.hasObservedProfile(tag[1])) {
          msg.observe = this.nostrBackendService.getObservedProfile(tag[1])
        }
      })
    } else if (event.subsKind == SubsKind.ZAP) {
      let bolt11 = this.nostrHelper.getTag(event.event, 'bolt11')[0][1]
      let b11 = decode(bolt11)
      // console.log(b11.sections)
      let amount = this.nostrHelper.getBolt11Section(b11.sections, "amount")
      msg.content = Math.floor((0 + amount.value) / 1000) + " sats"
      let description = this.nostrHelper.getTag(event.event, 'description')[0][1]
      // console.log(description)
      let event9734 = JSON.parse(description) as Event<9734>
      let sender = event9734.pubkey
      let receiver = (this.nostrHelper.getTag(event9734, 'p'))[0][1]
      if (this.nostrBackendService.hasObservedProfile(sender)) {
        msg.observe = this.nostrBackendService.getObservedProfile(sender)
        msg.msgKind = MsgKind.outgoing
        msg.content = Math.floor((0 + amount.value) / 1000) + " sats ⚡ to " + receiver.substring(0, 6) + "..."
      } else {
        if (this.nostrBackendService.hasObservedProfile(receiver)) {
          msg.observe = this.nostrBackendService.getObservedProfile(receiver)
        }
        msg.msgKind = MsgKind.incoming
        msg.content = Math.floor((0 + amount.value) / 1000) + " sats ⚡ from " + sender.substring(0, 6) + "..."
      }
    }

    if ((this.texts.length == 0) || (this.texts[0].timestamp_unix < msg.timestamp_unix)) {
      this.texts.unshift(msg)
    } else {
      this.texts.push(msg)
    }

  }

  onProfilesButtonPress() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    this.modalDialog.open(ProfileSelectorComponent, dialogConfig)
  }

  private onError(err: any) {

  }

  private onComplete() {

  }

  date_TO_String(date_Object: Date) {
    return formatDate(date_Object, "MM/dd HH:mm", "en-US")

  }

  protected readonly MsgKind = MsgKind;
}

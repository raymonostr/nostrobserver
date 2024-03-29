export class ObservedProfiles {
  public hex_pub: string
  public avatar_url: string
  public nip05: string
  public lud16: string
  public watch_post: boolean
  public watch_mentions: boolean
  public watch_zaps: boolean
  public display_color: string
  public alias: string

  constructor(hex_pub: string, avatar_url: string, nip05: string, watch_post: boolean,
              watch_mentions: boolean, watch_zaps: boolean) {
    this.hex_pub = hex_pub
    this.avatar_url = avatar_url
    this.nip05 = nip05
    this.lud16 = ""
    this.watch_post = watch_post
    this.watch_mentions = watch_mentions
    this.watch_zaps = watch_zaps
    this.display_color = "burlywood"
    this.alias = hex_pub.substring(0, 3) + "..." + hex_pub.substring(29, 32)
  }

  static emptyObservedProfile() {
    return new ObservedProfiles('', '', '', false,
      false, false)
  }

}

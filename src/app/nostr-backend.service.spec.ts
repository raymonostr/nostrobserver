import { TestBed } from '@angular/core/testing';

import { NostrBackendService } from './nostr-backend.service';

describe('NostrBackendService', () => {
  let service: NostrBackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NostrBackendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
